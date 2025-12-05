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
	companyName: z.string().min(1, "Company name is required"),
	email: z.string().trim().pipe(z.email("Invalid email address")),
	password: z.string().min(6, "Password must be at least 6 characters"),
	address: z.string().optional(),
});

function errorResponse(message: string, status = 400) {
	return NextResponse.json<ApiResponse<null>>(
		{ success: false, error: message },
		{ status }
	);
}

export async function POST(req: Request) {
	try {
		// Validate request body
		const { companyName, email, password, address } = registerSchema.parse(
			await req.json()
		);

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
			return errorResponse(supaError.message, 400);
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
			ApiResponse<{
				id: string;
				email: string;
				role: string;
				companyId: string;
				companyName: string;
			}>
		>({
			success: true,
			data: {
				id: supabaseUser.id,
				email,
				role: "ADMIN",
				companyId: company.id,
				companyName,
			},
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return errorResponse(err.issues[0].message, 400);
		}

		const message =
			err instanceof Error ? err.message : "Server error during registration";

		console.error("❌ Register error:", message);
		return errorResponse(message, 500);
	}
}
