// app/api/company/[companyId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	const { companyId } = await context.params;

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
		},
	});

	if (!company) {
		return NextResponse.json({ error: "Company not found" }, { status: 404 });
	}

	return NextResponse.json(company);
}
