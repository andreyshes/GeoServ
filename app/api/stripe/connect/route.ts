import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
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

		let accountId = company.stripeAccountId ?? null;
		let account: Stripe.Account | null = null;

		if (accountId) {
			try {
				account = await stripe.accounts.retrieve(accountId);

				// Handle incomplete onboarding
				if (!account.details_submitted) {
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
			} catch (err: any) {
				// If retrieval fails, nullify and recreate
				console.warn(`⚠️ Invalid Stripe account (${accountId}), recreating...`);
				accountId = null;
				account = null;
			}
		}

		// ✅ 2. Create new account if none exists or invalid
		if (!accountId || !account) {
			account = await stripe.accounts.create({
				type: "express",
				country: "US",
				business_type: "individual",
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

		// ✅ 3. Re-request missing capabilities if inactive
		const cardPaymentsStatus = account.capabilities?.card_payments;
		const transfersStatus = account.capabilities?.transfers;

		if (cardPaymentsStatus !== "active" || transfersStatus !== "active") {
			console.log(
				`⚙️ Capabilities missing/pending (card_payments=${cardPaymentsStatus}, transfers=${transfersStatus}) — requesting again`
			);

			await stripe.accounts.update(accountId, {
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
			});
		}

		// ✅ 4. If account onboarded but still not fully active, re-open onboarding link
		if (
			account.details_submitted &&
			(cardPaymentsStatus !== "active" || transfersStatus !== "active")
		) {
			const link = await stripe.accountLinks.create({
				account: accountId,
				refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
				return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?companyId=${companyId}`,
				type: "account_onboarding",
			});

			console.log(
				`🔁 Account ${accountId} onboarded but awaiting capability approval — sending onboarding link again`
			);

			return NextResponse.json({ url: link.url });
		}

		// ✅ 5. Otherwise, create a normal onboarding link
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
		return NextResponse.json(
			{ error: err?.message || "Stripe connection failed" },
			{ status: 500 }
		);
	}
}
