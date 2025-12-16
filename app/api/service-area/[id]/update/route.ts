import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

const paramsSchema = z.object({
	id: z.cuid(),
});

const bodySchema = z.object({
	availableDays: z
		.array(
			z.enum([
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			])
		)
		.min(1, "At least one available day is required"),

	radiusKm: z.number().positive().max(500).optional(),
});

export async function PATCH(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await context.params);
		const { availableDays, radiusKm } = bodySchema.parse(await req.json());

		const area = await db.serviceArea.update({
			where: { id },
			data: {
				availableDays,
				...(radiusKm !== undefined && { radiusKm }),
			},
		});

		return NextResponse.json<ApiResponse<typeof area>>({
			success: true,
			data: area,
		});
	} catch (err) {
		console.error("❌ Failed to update service area days:", err);
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
