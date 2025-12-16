import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/lib/type";
import { z } from "zod";

const paramsSchema = z.object({
	id: z.cuid(),
});

export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await context.params);

		const booking = await db.booking.findUnique({
			where: { id },
			include: {
				company: true,
				customer: true,
			},
		});

		if (!booking) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Booking not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json<ApiResponse<{ booking: typeof booking }>>({
			success: true,
			data: { booking },
		});
	} catch (error: any) {
		console.error("❌ Error fetching booking:", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
