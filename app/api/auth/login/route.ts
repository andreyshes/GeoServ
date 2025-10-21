import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
	try {
		const { email, password } = await req.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Missing email or password" },
				{ status: 400 }
			);
		}

		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error || !data.user) {
			console.error("❌ Supabase login error:", error?.message);
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		const user = data.user;

		const dbUser =
			(await db.user.findUnique({
				where: { authUserId: user.id },
				include: { company: true },
			})) ||
			(await db.user.findUnique({
				where: { email: user.email! },
				include: { company: true },
			}));

		if (!dbUser || !dbUser.company) {
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
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Server error during login";
		console.error("❌ Login error:", message);

		return NextResponse.json({ error: message }, { status: 500 });
	}
}
