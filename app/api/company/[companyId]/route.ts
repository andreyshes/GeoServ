// app/api/company/[companyId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const companyResponseSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	address: z.string().nullable(),
	addressLat: z.number().nullable(),
	addressLng: z.number().nullable(),
	logoUrl: z.string().nullable(),
	domain: z.string().nullable(),
	stripeAccountId: z.string().nullable(),
	subscriptionStatus: z.enum(["active", "suspended", "cancelled"]).nullable(),
	createdAt: z.date(),
});

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await params;

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

		const parsed = companyResponseSchema.parse(company);

		console.log("✅ Company loaded:", companyId);
		return NextResponse.json(parsed);
	} catch (err) {
		console.error("💥 Error fetching company:", err);

		if (err instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid company response", issues: err.issues },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to load company info" },
			{ status: 500 }
		);
	}
}
