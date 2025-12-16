import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

const bookingQuerySchema = z.object({
	status: z.string().optional(),

	paid: z
		.enum(["true", "false"])
		.transform((val) => val === "true")
		.optional(),

	from: z.iso
		.datetime()
		.transform((val) => new Date(val))
		.optional(),

	to: z.iso
		.datetime()
		.transform((val) => new Date(val))
		.optional(),
});
export async function GET(
	request: Request,
	context: { params: Promise<{ customerId: string }> }
) {
	try {
		const { customerId } = await context.params;
		const { searchParams } = new URL(request.url);

		const query = bookingQuerySchema.parse(
			Object.fromEntries(searchParams.entries())
		);

		const filters: any = {
			customerId,
			...(query.status && { status: query.status }),
			...(query.paid !== undefined && { paid: query.paid }),
			...(query.from || query.to
				? {
						date: {
							...(query.from && { gte: query.from }),
							...(query.to && { lte: query.to }),
						},
					}
				: {}),
		};
		const bookings = await db.booking.findMany({
			where: filters,
			include: {
				company: {
					select: { name: true, domain: true, logoUrl: true },
				},
			},
			orderBy: { date: "asc" },
		});

		return NextResponse.json<ApiResponse<typeof bookings>>(
			{ success: true, data: bookings },
			{ status: 200 }
		);
	} catch (error) {
		console.error("❌ Error fetching customer bookings:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: error.message,
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
