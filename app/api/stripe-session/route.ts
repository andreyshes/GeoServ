import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

// ---------- ZOD SCHEMAS ----------
const QuerySchema = z.object({
	session_id: z.string().min(1, "session_id is required"),
});

const StripeMetaSchema = z.object({
	bookingId: z.string().uuid("Invalid bookingId format"),
});

// ---------- HANDLER ----------
export async function GET(req: Request) {
	try {
		// Extract and validate query params
		const { searchParams } = new URL(req.url);

		const parseResult = QuerySchema.safeParse({
			session_id: searchParams.get("session_id"),
		});

		if (!parseResult.success) {
			return NextResponse.json(
				{ error: parseResult.error.format() },
				{ status: 400 }
			);
		}

		const { session_id } = parseResult.data;

		// Retrieve Stripe session
		const session = await stripe.checkout.sessions.retrieve(session_id);

		// Validate metadata
		const metaResult = StripeMetaSchema.safeParse(session.metadata);
		if (!metaResult.success) {
			return NextResponse.json(
				{ error: "Invalid or missing bookingId in Stripe metadata" },
				{ status: 400 }
			);
		}

		const { bookingId } = metaResult.data;

		// Fetch booking
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: { company: true, customer: true },
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: booking });
	} catch (err) {
		console.error("Checkout success error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
