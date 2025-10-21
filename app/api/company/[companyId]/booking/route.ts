import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	request: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params;
		const { searchParams } = new URL(request.url);

		// Pagination
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const skip = (page - 1) * limit;

		// Filters
		const status = searchParams.get("status") || undefined;
		const paid = searchParams.get("paid");
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		console.log("🏢 Fetching company bookings:", {
			companyId,
			page,
			limit,
			status,
			paid,
			from,
			to,
		});

		const filters: any = { companyId };

		if (status) filters.status = status;
		if (paid === "true" || paid === "false") filters.paid = paid === "true";
		if (from || to) {
			filters.date = {};
			if (from) filters.date.gte = new Date(from);
			if (to) filters.date.lte = new Date(to);
		}

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
				take: limit,
			}),
			db.booking.count({ where: filters }),
		]);

		console.log(`✅ Found ${bookings.length} bookings (total ${total})`);

		return NextResponse.json({
			bookings,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		});
	} catch (error: any) {
		console.error("❌ Error fetching company bookings:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
