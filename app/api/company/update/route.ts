import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

const updateSchema = z.object({
	companyId: z.cuid(),
	name: z.string().trim().min(1).max(100).optional(),
	address: z.string().trim().min(5).max(200).nullable().optional(),
	addressLat: z.number().min(-90).max(90).nullable().optional(),
	addressLng: z.number().min(-180).max(180).nullable().optional(),
});
export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { companyId, name, address, addressLat, addressLng } =
			updateSchema.parse(body);

		const data: Record<string, unknown> = {};

		if (name !== undefined) data.name = name;
		if (address !== undefined) data.address = address;
		if (addressLat !== undefined) data.addressLat = addressLat;
		if (addressLng !== undefined) data.addressLng = addressLng;

		if (Object.keys(data).length === 0) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "No update fields provided",
				},
				{ status: 400 }
			);
		}

		const company = await db.company.update({
			where: { id: companyId },
			data,
		});

		return NextResponse.json<ApiResponse<typeof company>>(
			{
				success: true,
				data: company,
			},
			{
				status: 200,
			}
		);
	} catch (err: any) {
		console.error("❌ Error updating company:", err);
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: err.message,
				},
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
