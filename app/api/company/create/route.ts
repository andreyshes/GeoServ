import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const { name, domain } = await req.json();

		const company = await db.company.create({
			data: {
				name,
				domain,
				logoUrl: `https://placehold.co/200x50?text=${encodeURIComponent(name)}`,
				subscriptionStatus: "active",
			},
		});

		return NextResponse.json({ company });
	} catch (error: any) {
		console.error("❌ Error creating company:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
