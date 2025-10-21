import { db } from "@/lib/db";
import { Resend } from "resend";
import BookingConfirmationEmail from "@/app/emails/BookingConfirmationEmail";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
	try {
		const sig = req.headers.get("stripe-signature")!;
		const rawBody = await req.text();

		const event = stripe.webhooks.constructEvent(
			rawBody,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!
		);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object as Stripe.Checkout.Session;
			const bookingId =
				session.metadata?.bookingId ||
				new URL(session.success_url || "").searchParams.get("bookingId");

			if (!bookingId) {
				console.warn("⚠️ No bookingId in session metadata");
				return NextResponse.json({ received: true });
			}

			const paymentIntent = await stripe.paymentIntents.retrieve(
				session.payment_intent as string,
				{ expand: ["latest_charge"] }
			);

			let receiptUrl;
			if (
				paymentIntent.latest_charge &&
				typeof paymentIntent.latest_charge !== "string"
			) {
				receiptUrl = paymentIntent.latest_charge.receipt_url;
			}

			const booking = await db.booking.update({
				where: { id: bookingId },
				data: {
					paid: true,
					status: "confirmed",
					paymentId: session.payment_intent as string,
					paymentReceiptUrl: receiptUrl,
				},
				include: { customer: true, company: true },
			});

			await resend.emails.send({
				from: "GeoServ <notify@geoserv.org>",
				to: booking.customer.email,
				subject: `Your ${booking.company?.name || "GeoServ"} Booking Confirmation`,
				react: BookingConfirmationEmail({
					name: booking.customer.firstName,
					company: booking.company?.name || "GeoServ",
					service: booking.serviceType,
					date: booking.date.toLocaleString(),
					slot: booking.slot,
					ref: booking.id,
					receiptUrl: booking.paymentReceiptUrl || undefined,
				}),
			});
		}

		return NextResponse.json({ received: true });
	} catch (err: any) {
		console.error("⚠️ Webhook error:", err);
		return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
	}
}
