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

		// 🧠 Get company from DB
		const company = await db.company.findUnique({ where: { id: companyId } });
		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		let accountId = company.stripeAccountId;
		let account;

		// ✅ Retrieve or recreate Stripe account
		if (accountId) {
			try {
				account = await stripe.accounts.retrieve(accountId);
			} catch (err) {
				console.warn(`⚠️ Invalid Stripe account ${accountId}, recreating...`);
				accountId = null;
			}
		}

		if (!accountId || !account) {
			// 🧩 Create a new connected account with full capabilities requested
			account = await stripe.accounts.create({
				type: "express",
				country: "US",
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
				business_type: "company",
				metadata: { companyId },
			});

			accountId = account.id;

			// ✅ Update the company record with the new accountId
			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});

			console.log("✅ Created new connected account:", accountId);
		}

		// 🧠 Ensure capabilities are requested & active
		const needsUpdate =
			account.capabilities?.card_payments !== "active" ||
			account.capabilities?.transfers !== "active";

		if (needsUpdate) {
			console.log("⚙️ Updating Stripe capabilities for", accountId);

			// Request capabilities again (in case they were not requested initially)
			await stripe.accounts.update(accountId, {
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			});
		}

		// ✅ Update DB if capabilities changed or were missing before
		if (needsUpdate || !company.stripeAccountId) {
			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});
		}

		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/onboarding/callback?account=${accountId}`,
			type: "account_onboarding",
		});

		return NextResponse.json({ url: accountLink.url });
	} catch (err: any) {
		console.error("❌ Stripe Connect error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
