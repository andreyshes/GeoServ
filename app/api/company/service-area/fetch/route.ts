import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const companyId = searchParams.get("companyId");
	if (!companyId)
		return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

	try {
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

		const company = await db.company.findUnique({ where: { id: companyId } });
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
	} catch (err: any) {
		console.error("❌ Error fetching service area:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
