import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
	try {
		const bookings = await db.booking.findMany({
			orderBy: { date: "asc" },
			include: {
				customer: true,
			},
		});
		return NextResponse.json({ bookings });
	} catch (err) {
		console.error("Error loading bookings:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
