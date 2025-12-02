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

		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

		const userId = data.user.id;

		let dbUser = await db.user.findUnique({
			where: { authUserId: userId },
			include: { company: true },
		});

		if (!dbUser)
			dbUser = await db.user.findUnique({
				where: { email },
				include: { company: true },
			});

		if (!dbUser?.company) {
			console.warn("⚠️ No company linked — creating placeholder:", email);

			const newCompany = await db.company.create({
				data: {
					name: email.split("@")[0],
					domain: email.split("@")[1],
				},
			});

			dbUser = await db.user.update({
				where: { id: dbUser!.id },
				data: { companyId: newCompany.id },
				include: { company: true },
			});

			console.log(`🏢 Linked new company ${newCompany.name} to ${email}`);
		}

		console.log("✅ Login success for:", dbUser.email);

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
