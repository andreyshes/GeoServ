import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params; // ✅ await the params

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
		});

		return NextResponse.json({ serviceAreas });
	} catch (err: any) {
		console.error("❌ Failed to fetch service areas:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
