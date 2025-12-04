import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { getCoordinates } from "@/lib/geo";
import { z } from "zod";

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

const registerSchema = z.object({
	companyName: z.string().min(1),
	email: z.string().trim().pipe(z.email()),
	password: z.string().min(6),
	address: z.string().optional(),
});

export async function POST(req: Request) {
	try {
		const json = await req.json();
		const { companyName, email, password, address } =
			registerSchema.parse(json);

		let addressLat: number | null = null;
		let addressLng: number | null = null;

		if (address) {
			try {
				const coords = await getCoordinates(address);
				if (coords) {
					addressLat = coords.lat;
					addressLng = coords.lng;
				}
			} catch (geoErr) {
				console.warn("⚠️ Geocoding failed:", geoErr);
			}
		}

		const origin = req.headers.get("origin") || "";
		const hostname = new URL(origin).hostname || "geoserv.org";
		const uniqueDomain = `${companyName
			.toLowerCase()
			.replace(/\s+/g, "-")}.${hostname}`;

		const company = await db.company.create({
			data: {
				name: companyName,
				domain: uniqueDomain,
				logoUrl: `https://placehold.co/200x50?text=${encodeURIComponent(
					companyName
				)}`,
				subscriptionStatus: "active",
				address: address || null,
				addressLat,
				addressLng,
			},
		});

		const supabaseAdmin = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const { data: supaData, error: supaError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: {
					role: "ADMIN",
					companyId: company.id,
				},
			});

		if (supaError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: supaError.message,
				},
				{ status: 400 }
			);
		}

		const supabaseUser = supaData.user;
		if (!supabaseUser) throw new Error("Failed to create Supabase user.");

		await db.user.create({
			data: {
				authUserId: supabaseUser.id,
				email,
				name: companyName,
				role: "ADMIN",
				companyId: company.id,
			},
		});

		return NextResponse.json<
			ApiResponse<{ companyId: string; userId: string }>
		>({
			success: true,
			data: {
				companyId: company.id,
				userId: supabaseUser.id,
			},
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: err.message,
				},
				{ status: 400 }
			);
		}

		const message =
			err instanceof Error ? err.message : "Server error during registration";

		console.error("❌ Register error:", message);

		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: message,
			},
			{ status: 500 }
		);
	}
}
