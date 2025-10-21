import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	{
		const services = await db.service.findMany({
			where: { companyId: id },
			select: { id: true, name: true, priceCents: true, durationText: true },
		});
		return NextResponse.json({ services });
	}
}
