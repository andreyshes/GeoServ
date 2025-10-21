import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const { status } = await req.json();

		if (!["completed", "canceled", "pending", "confirmed"].includes(status)) {
			return NextResponse.json({ error: "Invalid status" }, { status: 400 });
		}

		await db.booking.update({
			where: { id },
			data: { status },
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("❌ Error updating booking:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
