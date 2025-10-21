import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const now = new Date();

		const result = await db.booking.updateMany({
			where: {
				date: { lt: now },
				status: "pending",
			},
			data: { status: "completed" },
		});

		return NextResponse.json({
			message: `✅ Auto-marked ${result.count} bookings as completed.`,
		});
	} catch (err) {
		console.error("Cleanup job failed:", err);
		return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
	}
}
