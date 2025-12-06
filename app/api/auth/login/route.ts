import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { db } from "@/lib/db";
import { z } from "zod";

const userLoginSchema = z.object({
	email: z.string().trim().trim().email(),
	password: z.string().min(6),
});

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

export async function POST(req: Request) {
	try {
		const { email, password } = userLoginSchema.parse(await req.json());

		console.log("📥 Login attempt:", email);

	const supabase = createRouteHandlerClient({
	cookies: () => cookies()
});



		const { data, error: SignInError } = await supabase.auth.signInWithPassword(
			{ email, password }
		);

		if (SignInError || !data.user) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		const userId = data.user.id;

		// Look up user in local DB
		let dbUser = await db.user.findUnique({
			where: { authUserId: userId },
			include: { company: true },
		});

		if (!dbUser) {
			dbUser = await db.user.findUnique({
				where: { email },
				include: { company: true },
			});
		}

		if (!dbUser) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "User profile not found after sign-in",
				},
				{ status: 404 }
			);
		}

		// Auto-create a company if missing
		if (!dbUser.company) {
			const companyDomain = email.split("@").pop() || "default";
			const companyName = email.split("@")[0];

			const newCompany = await db.company.create({
				data: {
					name: companyName,
					domain: companyDomain,
				},
			});

			dbUser = await db.user.update({
				where: { id: dbUser.id },
				data: { companyId: newCompany.id },
				include: { company: true },
			});
		}

		console.log("✅ Login success for:", dbUser.email);

		return NextResponse.json<ApiResponse<LoginResponse>>({
			success: true,
			data: {
				id: dbUser.id,
				email: dbUser.email,
				role: dbUser.role,
				companyId: dbUser.companyId,
				companyName: dbUser.company?.name || "Unknown Company",
			},
		});
	} catch (err) {
		console.error("❌ Login route crashed:", err);

		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Invalid input data" },
				{ status: 400 }
			);
		}

		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
function email(): any {
	throw new Error("Function not implemented.");
}

