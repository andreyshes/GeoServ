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

		if (!company || !company.stripeAccountId) {
			return NextResponse.json({ connected: false });
		}

		// 🧾 Retrieve Stripe account
		const account = await stripe.accounts.retrieve(company.stripeAccountId);

		const cardStatus = account.capabilities?.card_payments;
		const transferStatus = account.capabilities?.transfers;
		const detailsSubmitted = account.details_submitted;

		const connected =
			cardStatus === "active" &&
			transferStatus === "active" &&
			detailsSubmitted === true;

		return NextResponse.json({
			connected,
			accountId: account.id,
			cardStatus,
			transferStatus,
			detailsSubmitted,
		});
	} catch (err: any) {
		console.error("❌ Stripe check-status error:", err.message);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
