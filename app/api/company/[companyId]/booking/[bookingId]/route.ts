import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ApiResponse } from "@/lib/type";
import { z } from "zod";

const paramsSchema = z.object({
	companyId: z.cuid(),
	bookingId: z.cuid(),
});

const bodySchema = z.object({
	status: z.enum(["pending", "confirmed", "completed", "canceled"]),
});

export async function PATCH(
	req: Request,
	context: { params: Promise<{ companyId: string; bookingId: string }> }
) {
	try {
		const params = paramsSchema.parse(await context.params);

		const body = bodySchema.parse(await req.json());

		await db.booking.update({
			where: { id: params.bookingId, companyId: params.companyId },
			data: { status: body.status },
		});

		return NextResponse.json<ApiResponse<null>>(
			{ success: true },
			{ status: 200 }
		);
	} catch (err) {
		console.error("❌ Error updating booking:", err);
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: err.message },
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
