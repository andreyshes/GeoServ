import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@/lib/db";

export async function GET(
	_req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params;

		const services = await db.service.findMany({
			where: { companyId },
			select: {
				id: true,
				name: true,
				priceCents: true,
				durationText: true,
			},
			orderBy: { name: "asc" },
		});

		console.log("🧩 Public Services API called for company:", companyId);

		return NextResponse.json({ services });
	} catch (error) {
		console.error("❌ Error fetching services:", error);
		return NextResponse.json(
			{ error: "Failed to load services" },
			{ status: 500 }
		);
	}
}

export async function POST(
	req: Request,
	context: { params: Promise<{ companyId: string }> }
) {
	try {
		const { companyId } = await context.params;

		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		console.log("🛎️ Creating service with data:", body);
		const { name, priceCents, durationText, durationMinutes } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Service name is required" },
				{ status: 400 }
			);
		}

		const formattedDuration =
			durationText ?? (durationMinutes ? `${durationMinutes} min` : null);

		const service = await db.service.create({
			data: {
				name,
				priceCents: priceCents ?? null,
				durationText: formattedDuration,
				companyId,
			},
		});

		return NextResponse.json({ success: true, service });
	} catch (error) {
		console.error(
			"❌ Error creating service:",
			error instanceof Error ? error.message : error
		);

		return NextResponse.json(
			{ error: "Failed to create service" },
			{ status: 500 }
		);
	}
}
