import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET(
	req: Request,
	context: { params: Promise<{ sessionId: string }> }
) {
	const { sessionId } = await context.params;

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		const bookingId = session.metadata?.bookingId;

		if (!bookingId) {
			return NextResponse.json(
				{ error: "No bookingId found in session" },
				{ status: 404 }
			);
		}

		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { company: true, customer: true },
		});

		return NextResponse.json(booking);
	} catch (err: any) {
		console.error("❌ Failed to fetch booking by session:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
