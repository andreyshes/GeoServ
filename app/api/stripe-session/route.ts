import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const session_id = searchParams.get("session_id");

	if (!session_id) {
		return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
	}

	const session = await stripe.checkout.sessions.retrieve(session_id);

	const bookingId = session.metadata?.bookingId;
	if (!bookingId) {
		return NextResponse.json(
			{ error: "No bookingId in session metadata" },
			{ status: 404 }
		);
	}

	const booking = await db.booking.findUnique({
		where: { id: bookingId },
		include: { company: true, customer: true },
	});

	if (!booking) {
		return NextResponse.json({ error: "Booking not found" }, { status: 404 });
	}

	return NextResponse.json({ booking });
}
