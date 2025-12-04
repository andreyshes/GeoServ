import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

const paramsSchema = z.object({
	id: z.string().min(1),
});

const bodySchema = z.object({
	status: z.enum(["completed", "canceled", "pending", "confirmed"]),
});

export async function PATCH(
	req: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		//validate route params
		const { id } = paramsSchema.parse(await context.params);

		//validate request body
		const { status } = bodySchema.parse(await req.json());

		const updated = await db.booking.update({
			where: { id },
			data: { status },
		});

		return NextResponse.json<ApiResponse<typeof updated>>({
			success: true,
			data: updated,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "Invalid request data",
				},
				{ status: 400 }
			);
		}
		console.error("❌ Error updating booking:", err);

		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
