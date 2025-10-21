import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/notifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

export const config = { api: { bodyParser: false } };

async function readRawBody(req: Request): Promise<Buffer> {
	const chunks: Uint8Array[] = [];
	const reader = req.body?.getReader();
	if (!reader) return Buffer.from("");
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}
	return Buffer.concat(chunks);
}

export async function POST(req: Request) {
	const sig = req.headers.get("stripe-signature");
	if (!sig)
		return NextResponse.json(
			{ error: "Missing Stripe signature" },
			{ status: 400 }
		);

	let event: Stripe.Event;
	try {
		const rawBody = await readRawBody(req);
		event = stripe.webhooks.constructEvent(
			rawBody,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!
		);
	} catch (err: any) {
		console.error("❌ Invalid Stripe signature:", err.message);
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	try {
		if (event.type === "checkout.session.completed") {
			const session = event.data.object as Stripe.Checkout.Session;
			const bookingId = session.metadata?.bookingId;

			if (!bookingId) {
				console.warn("⚠️ Missing bookingId in session metadata.");
				return NextResponse.json({ received: true });
			}

			const paymentIntent = await stripe.paymentIntents.retrieve(
				session.payment_intent as string,
				{ expand: ["latest_charge"] }
			);

			const charge = paymentIntent.latest_charge as Stripe.Charge | undefined;
			const receiptUrl = charge?.receipt_url || null;

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

			console.log(`✅ Booking ${bookingId} marked as paid.`);

			// ✅ Send confirmation email
			if (booking.customer?.email) {
				await sendConfirmationEmail({
					to: booking.customer.email,
					name: booking.customer.firstName,
					company: booking.company.name, // ✅ new line
					ref: booking.id,
					service: booking.serviceType,
					date: booking.date.toISOString(),
					slot: booking.slot,
					receiptUrl: receiptUrl ?? undefined,
				});

				console.log(`📧 Confirmation email sent to ${booking.customer.email}`);
			}
		}

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (err: any) {
		console.error("❌ Webhook processing error:", err.message);
		return NextResponse.json(
			{ error: "Webhook processing error" },
			{ status: 500 }
		);
	}
}
