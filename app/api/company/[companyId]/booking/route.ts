import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { type ApiResponse } from "@/lib/type";

const paramsSchema = z.object({
	companyId: z.cuid(),
});

const QuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(10),

	status: z.enum(["pending", "confirmed", "completed", "canceled"]).optional(),

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
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const params = paramsSchema.parse(await context.params);

		const query = QuerySchema.parse(
			Object.fromEntries(new URL(request.url).searchParams.entries())
		);

		const skip = (query.page - 1) * query.limit;

		const filters: any = {
			companyId: params.companyId,

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

		const [bookings, total] = await Promise.all([
			db.booking.findMany({
				where: filters,
				include: {
					customer: {
						select: {
							firstName: true,
							lastName: true,
							email: true,
							phone: true,
						},
					},
					company: {
						select: { name: true, domain: true, logoUrl: true },
					},
				},
				orderBy: { date: "desc" },
				skip,
				take: query.limit,
			}),
			db.booking.count({ where: filters }),
		]);

		return NextResponse.json<
			ApiResponse<{
				bookings: typeof bookings;
				total: number;
				page: number;
				totalPages: number;
			}>
		>({
			success: true,
			data: {
				bookings,
				total,
				page: query.page,
				totalPages: Math.ceil(total / query.limit),
			},
		});
	} catch (error) {
		console.error("❌ Error fetching company bookings:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
