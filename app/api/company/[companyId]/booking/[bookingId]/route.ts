import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ companyId: string; bookingId: string }> }
) {
	try {
		const { companyId, bookingId } = await context.params;

		const { status } = await req.json();

		if (!["pending", "confirmed", "completed", "canceled"].includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		await db.booking.update({
			where: { id: bookingId, companyId },
			data: { status },
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("❌ Error updating booking:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
