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

		const company = await db.company.findUnique({ where: { id: companyId } });
		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		let accountId = company.stripeAccountId;
		let account;

		if (accountId) {
			try {
				account = await stripe.accounts.retrieve(accountId);

				if (account.details_submitted === false) {
					console.log(
						`⚙️ Account ${accountId} found but onboarding incomplete — re-sending onboarding link`
					);

					const link = await stripe.accountLinks.create({
						account: accountId,
						refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
						return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?companyId=${companyId}`,
						type: "account_onboarding",
					});

					return NextResponse.json({
						url: link.url,
						message:
							"Please complete Stripe onboarding to activate your payments.",
					});
				}
			} catch (err) {
				console.warn(`⚠️ Invalid Stripe account (${accountId}), recreating...`);
				accountId = null;
			}
		}

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

		const cardPaymentsStatus = account.capabilities?.card_payments;
		const transfersStatus = account.capabilities?.transfers;

		if (cardPaymentsStatus !== "active" || transfersStatus !== "active") {
			console.log(
				`⚙️ Capabilities missing/pending (card_payments=${cardPaymentsStatus}, transfers=${transfersStatus}) → requesting again...`
			);

			await stripe.accounts.update(accountId, {
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			});
		}

		if (!company.stripeAccountId) {
			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});
		}

		if (
			account.details_submitted === true &&
			(cardPaymentsStatus !== "active" || transfersStatus !== "active")
		) {
			console.log(
				`🔁 Account ${accountId} onboarded but awaiting capability approval — redirecting to onboarding to finalize.`
			);
			const link = await stripe.accountLinks.create({
				account: accountId,
				refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
				return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?companyId=${companyId}`,
				type: "account_onboarding",
			});
			return NextResponse.json({ url: link.url });
		}

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
