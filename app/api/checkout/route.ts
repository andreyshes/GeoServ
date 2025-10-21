import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
	try {
		const { bookingId } = await req.json();

		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { company: true },
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: { name: booking.serviceType },
						unit_amount: booking.amountCents ?? 10000,
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/canceled`,
			metadata: {
				bookingId: booking.id,
			},
		});

		await db.booking.update({
			where: { id: booking.id },
			data: { stripeCheckoutSessionId: session.id },
		});

		return NextResponse.json({ checkoutUrl: session.url });
	} catch (err: any) {
		console.error("❌ Checkout Error:", err.message);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
