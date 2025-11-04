import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const { companyId, name, address, addressLat, addressLng } =
			await req.json();
		console.log("🏢 Updating company:", { companyId, name, address });

		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const data: Record<string, unknown> = {};

		if (typeof name === "string" && name.trim().length > 0) {
			data.name = name.trim();
		}

		if (address !== undefined) {
			data.address = address ?? null;
		}

		if (addressLat !== undefined) {
			data.addressLat = addressLat ?? null;
		}

		if (addressLng !== undefined) {
			data.addressLng = addressLng ?? null;
		}

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ error: "No update fields provided" },
				{ status: 400 }
			);
		}

		const company = await db.company.update({
			where: { id: companyId },
			data,
		});

		return NextResponse.json(company);
	} catch (err: any) {
		console.error("❌ Error updating company:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
