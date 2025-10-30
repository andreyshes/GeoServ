import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
	try {
		const { companyId } = await req.json();
		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		// 🔍 Fetch company
		const company = await db.company.findUnique({ where: { id: companyId } });
		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		let accountId = company.stripeAccountId;
		let account;

		// 🧩 Try to retrieve existing Stripe account
		if (accountId) {
			try {
				account = await stripe.accounts.retrieve(accountId);
			} catch (err) {
				console.warn(`⚠️ Invalid Stripe account (${accountId}), recreating...`);
				accountId = null;
			}
		}

		// 🧠 Create a new Express account if not found or invalid
		if (!accountId || !account) {
			account = await stripe.accounts.create({
				type: "express",
				country: "US",
				business_type: "company",
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
				metadata: { companyId },
			});

			accountId = account.id;
			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});

			console.log(
				`✅ Created new Stripe account for ${company.name}: ${accountId}`
			);
		}

		// 🧾 Ensure required capabilities are active or requested
		const cardPaymentsStatus = account.capabilities?.card_payments;
		const transfersStatus = account.capabilities?.transfers;

		if (cardPaymentsStatus !== "active" || transfersStatus !== "active") {
			console.log(
				`⚙️ Capabilities missing or pending (card_payments=${cardPaymentsStatus}, transfers=${transfersStatus}) → requesting again...`
			);

			await stripe.accounts.update(accountId, {
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			});
		}

		// 🧩 If capabilities were missing, make sure DB stays in sync
		if (
			!company.stripeAccountId ||
			cardPaymentsStatus !== "active" ||
			transfersStatus !== "active"
		) {
			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});
		}

		// 🌐 Generate onboarding link
		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?companyId=${companyId}`,
			type: "account_onboarding",
		});

		console.log(
			`🔗 Stripe onboarding link generated for ${company.name}: ${accountLink.url}`
		);

		return NextResponse.json({ url: accountLink.url });
	} catch (err: any) {
		console.error("❌ Stripe Connect error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
