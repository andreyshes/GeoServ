import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;

		if (!id) {
			return NextResponse.json(
				{ error: "Missing booking ID" },
				{ status: 400 }
			);
		}

		const booking = await db.booking.findUnique({
			where: { id },
			include: {
				company: true,
				customer: true,
			},
		});

		if (!booking) {
			return NextResponse.json({ error: "Booking not found" }, { status: 404 });
		}

		return NextResponse.json({ booking });
	} catch (err: any) {
		console.error("❌ Error fetching booking:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
