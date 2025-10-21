import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

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

		const amountCents = booking.amountCents ?? 10000;

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: booking.serviceType || "Service Payment",
							description: `${booking.company.name} — Booking`,
						},
						unit_amount: amountCents,
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation?bookingId=${booking.id}&paid=true`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation?bookingId=${booking.id}&paid=false`,
			metadata: {
				bookingId: booking.id,
			},
		});
		//
		await db.booking.update({
			where: { id: booking.id },
			data: { stripeCheckoutSessionId: session.id },
		});

		return NextResponse.json({ checkoutUrl: session.url });
	} catch (err: any) {
		console.error("❌ Checkout error:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
