import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { type ApiResponse } from "@/lib/type";
import { z } from "zod";

const paramsSchema = z.object({
	sessionId: z.string().min(1),
});

export async function GET(
	_req: Request,
	context: { params: Promise<{ sessionId: string }> }
) {
	const { sessionId } = paramsSchema.parse(await context.params);

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

		return NextResponse.json<ApiResponse<{ booking: typeof booking }>>({
			success: true,
			data: { booking },
		});
	} catch (err: any) {
		console.error("❌ Failed to fetch booking by session:", err);
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: err.message },
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: err.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
