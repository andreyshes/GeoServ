import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/lib/type";
import { z } from "zod";

const querySchema = z.object({
	companyId: z.cuid(),
});

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		const { companyId } = querySchema.parse(
			Object.fromEntries(searchParams.entries())
		);

		const serviceArea = await db.serviceArea.findFirst({
			where: { companyId },
		});

		if (serviceArea?.centerLat && serviceArea?.centerLng) {
			return NextResponse.json({
				source: "serviceArea",
				lat: serviceArea.centerLat,
				lng: serviceArea.centerLng,
				radiusKm: serviceArea.radiusKm || 30,
			});
		}

		const company = await db.company.findUnique({
			where: { id: companyId },
		});

		if (company?.addressLat && company?.addressLng) {
			return NextResponse.json({
				source: "company",
				lat: company.addressLat,
				lng: company.addressLng,
				radiusKm: 30,
			});
		}

		const latestBooking = await db.booking.findFirst({
			where: {
				companyId,
				addressLat: { not: null },
				addressLng: { not: null },
			},
			orderBy: { createdAt: "desc" },
		});

		if (latestBooking) {
			return NextResponse.json({
				source: "booking",
				lat: latestBooking.addressLat,
				lng: latestBooking.addressLng,
				radiusKm: 30,
			});
		}

		return NextResponse.json({ source: "none" });
	} catch (err) {
		console.error("❌ Error fetching service area:", err);

		if (err instanceof z.ZodError) {
			return NextResponse.json({ error: err.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
