import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
	try {
		const { bookingId } = await req.json();
		if (!bookingId) {
			return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
		}

		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { company: true },
		});

		if (!booking || !booking.company) {
			return NextResponse.json(
				{ error: "Booking or company not found" },
				{ status: 404 }
			);
		}

		const company = booking.company;
		if (!company.stripeAccountId) {
			return NextResponse.json(
				{ error: "Company not connected to Stripe" },
				{ status: 400 }
			);
		}

		const amountCents = booking.amountCents ?? 10000;
		const appFee = Math.round(amountCents * 0.1);

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: booking.serviceType || "Service Payment",
							description: `${company.name} — Booking`,
						},
						unit_amount: amountCents,
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation?bookingId=${booking.id}&paid=true`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation?bookingId=${booking.id}&paid=false`,
			metadata: { bookingId: booking.id },
			payment_intent_data: {
				on_behalf_of: company.stripeAccountId, 
				application_fee_amount: appFee,
				transfer_data: {
					destination: company.stripeAccountId,
				},
			},
		});

		await db.booking.update({
			where: { id: booking.id },
			data: { stripeCheckoutSessionId: session.id },
		});

		console.log("✅ Stripe checkout session created:", session.url);

		return NextResponse.json({ url: session.url });
	} catch (err: any) {
		console.error("❌ Checkout error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
