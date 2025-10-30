import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const { email, password } = await req.json();
		console.log("📥 Login attempt:", email);

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Missing email or password" },
				{ status: 400 }
			);
		}

		// ✅ FIX: use callback form, not async/await
		const supabase = createRouteHandlerClient({ cookies });

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error || !data.user) {
			console.error("❌ Invalid login:", error?.message);
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		const dbUser =
			(await db.user.findUnique({
				where: { authUserId: data.user.id },
				include: { company: true },
			})) ||
			(await db.user.findUnique({
				where: { email: data.user.email! },
				include: { company: true },
			}));

		if (!dbUser || !dbUser.company) {
			console.warn("⚠️ User not linked to a company:", email);
			return NextResponse.json(
				{ error: "User not linked to a company" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Login successful",
			user: {
				id: dbUser.id,
				email: dbUser.email,
				role: dbUser.role,
				companyId: dbUser.companyId,
				companyName: dbUser.company.name,
			},
		});
	} catch (err: any) {
		console.error("❌ Login route crashed:", err.message);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
