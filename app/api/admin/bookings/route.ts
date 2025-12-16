import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

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
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "Invalid request data",
				},
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
