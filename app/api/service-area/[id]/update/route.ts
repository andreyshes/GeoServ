import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, context: any) {
	try {
		const { id } = await context.params;
		const { availableDays } = await req.json();

		if (!Array.isArray(availableDays) || availableDays.length === 0) {
			return NextResponse.json(
				{ error: "Invalid available days" },
				{ status: 400 }
			);
		}

		const area = await db.serviceArea.update({
			where: { id },
			data: { availableDays },
		});

		return NextResponse.json(area);
	} catch (err) {
		console.error("❌ Failed to update service area days:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
