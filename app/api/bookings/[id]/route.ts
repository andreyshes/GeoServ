import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		console.log("📦 Fetching booking:", id);

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
	} catch (error: any) {
		console.error("❌ Error fetching booking:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
