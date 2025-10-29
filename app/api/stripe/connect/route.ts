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

		let accountValid = false;
		if (accountId) {
			try {
				const existing = await stripe.accounts.retrieve(accountId);
				accountValid = !!existing.id;
			} catch {
				console.warn("⚠️ Invalid or test Stripe account — recreating");
				accountId = null;
			}
		}

		if (!accountId || !accountValid) {
			const newAccount = await stripe.accounts.create({
				type: "express",
				country: "US",
				capabilities: {
					card_payments: { requested: true },
					transfers: { requested: true },
				},
				business_type: "company",
				metadata: { companyId },
			});

			accountId = newAccount.id;

			await db.company.update({
				where: { id: companyId },
				data: { stripeAccountId: accountId },
			});
		}

		const accountLink = await stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success`,
			type: "account_onboarding",
		});

		return NextResponse.json({ url: accountLink.url });
	} catch (err: any) {
		console.error("❌ Stripe Connect error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
