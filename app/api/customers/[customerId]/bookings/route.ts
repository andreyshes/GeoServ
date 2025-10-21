import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	request: Request,
	context: { params: Promise<{ customerId: string }> }
) {
	try {
		const { customerId } = await context.params;
		const { searchParams } = new URL(request.url);

		const status = searchParams.get("status") || undefined;
		const paid = searchParams.get("paid");
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		console.log("👤 Fetching customer bookings:", {
			customerId,
			status,
			paid,
			from,
			to,
		});

		const filters: any = { customerId };
		if (status) filters.status = status;
		if (paid !== null) filters.paid = paid === "true";
		if (from || to) {
			filters.date = {};
			if (from) filters.date.gte = new Date(from);
			if (to) filters.date.lte = new Date(to);
		}

		const bookings = await db.booking.findMany({
			where: filters,
			include: {
				company: {
					select: { name: true, domain: true, logoUrl: true },
				},
			},
			orderBy: { date: "asc" },
		});

		return NextResponse.json({ bookings });
	} catch (error: any) {
		console.error("❌ Error fetching customer bookings:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
