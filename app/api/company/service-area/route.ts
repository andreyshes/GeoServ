import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		console.log("📥 Incoming body:", body);

		const { companyId, type, centerLat, centerLng, radiusKm, name } = body;

		if (!companyId || !type) {
			console.warn("❌ Missing required fields:", { companyId, type });
			return NextResponse.json(
				{ error: "Missing required fields", received: { companyId, type } },
				{ status: 400 }
			);
		}

		let serviceArea = await db.serviceArea.findFirst({
			where: { companyId },
		});

		if (serviceArea) {
			serviceArea = await db.serviceArea.update({
				where: { id: serviceArea.id },
				data: { type, centerLat, centerLng, radiusKm, name },
			});
		} else {
			serviceArea = await db.serviceArea.create({
				data: { companyId, type, centerLat, centerLng, radiusKm, name },
			});
		}

		console.log("✅ Saved service area:", serviceArea);
		return NextResponse.json(serviceArea);
	} catch (err: any) {
		console.error("💥 Error in /api/company/service-area:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
