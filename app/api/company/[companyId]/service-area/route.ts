import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params;

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
			select: {
				id: true,
				name: true,
				type: true,
				centerLat: true,
				centerLng: true,
				radiusKm: true,
				availableDays: true,
				updatedAt: true,
			},
		});

		console.log("📡 Returning service areas:", serviceAreas);
		return NextResponse.json({ serviceAreas });
	} catch (err: any) {
		console.error("❌ Failed to fetch service areas:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
