import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@/lib/db";
import { z } from "zod";

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

type LoginResponse = {
	id: string;
	email: string;
	role: string;
	companyId: string;
	companyName: string;
};

const userLoginSchema = z.object({
	email: z.string().trim().pipe(z.email()),
	password: z.string().min(6),
});

export async function POST(req: Request) {
	try {
		// Parse and validate request body
		const json = await req.json();
		const { email, password } = userLoginSchema.parse(json);
		console.log("📥 Login attempt:", email);

		// Initialize Supabase client
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		const { data, error: SignInError } = await supabase.auth.signInWithPassword(
			{
				email,
				password,
			}
		);

		// Handle authentication errors
		if (SignInError || !data.user) {
			return (
				NextResponse.json<ApiResponse<null>>({
					success: false,
					error: "Invalid email or password",
				}),
				{
					status: 401,
				}
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

		return NextResponse.json<ApiResponse<LoginResponse>>({
			success: true,
			data: {
				id: dbUser.id,
				email: dbUser.email,
				role: dbUser.role,
				companyId: dbUser.companyId,
				companyName: dbUser.company.name,
			},
		});
	} catch (err: any) {
		console.error("❌ Login route crashed:", err.message);
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: err.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
