// app/api/company/[companyId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params;

		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const company = await db.company.findUnique({
			where: { id: companyId },
			select: {
				id: true,
				name: true,
				address: true,
				addressLat: true,
				addressLng: true,
				logoUrl: true,
				domain: true,
				stripeAccountId: true,
				subscriptionStatus: true,
				createdAt: true,
			},
		});

		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		console.log("✅ Company loaded:", companyId);
		return NextResponse.json(company);
	} catch (err: any) {
		console.error("💥 Error fetching company:", err);
		return NextResponse.json(
			{ error: err.message || "Failed to load company info" },
			{ status: 500 }
		);
	}
}
