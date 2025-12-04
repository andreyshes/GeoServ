import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

export async function GET() {
	try {
		const bookings = await db.booking.findMany({
			orderBy: { date: "asc" },
			include: {
				customer: true,
			},
		});

		return NextResponse.json<ApiResponse<typeof bookings>>({
			success: true,
			data: bookings,
		});
	} catch (err) {
		console.error("Error loading bookings:", err);
		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
