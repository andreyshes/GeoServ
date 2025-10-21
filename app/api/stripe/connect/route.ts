import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
	try {
		const { companyId } = await req.json();
		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const company = await db.company.findUnique({ where: { id: companyId } });

		let accountId = company?.stripeAccountId;
		if (!accountId) {
			const account = await stripe.accounts.create({
				type: "express",
				capabilities: { transfers: { requested: true } },
			});

			accountId = account.id;

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
