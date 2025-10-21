import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
	try {
		const { companyName, email, password } = await req.json();

		if (!companyName || !email || !password) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const origin = req.headers.get("origin") || "";
		const hostname = new URL(origin).hostname || "localhost";

		const company = await db.company.upsert({
			where: { domain: hostname },
			update: {},
			create: {
				name: companyName,
				domain: hostname,
				logoUrl: `https://placehold.co/200x50?text=${encodeURIComponent(companyName)}`,
				subscriptionStatus: "active",
			},
		});

		const supabaseAdmin = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);

		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				role: "ADMIN",
				companyId: company.id,
			},
		});

		if (error) {
			console.error("Supabase error:", error.message);
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		const supabaseUser = data.user;
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

		console.log(`✅ Company created: ${company.name}`);
		console.log(`👤 Admin user: ${email}`);

		return NextResponse.json({
			success: true,
			message: "Company and admin account created successfully",
			companyId: company.id,
			userId: supabaseUser.id,
		});
	} catch (err: any) {
		console.error("❌ Register error:", err);
		return NextResponse.json(
			{ error: err.message || "Server error during registration" },
			{ status: 500 }
		);
	}
}
