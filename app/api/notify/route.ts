import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import NotServicedEmail from "@/app/emails/NotServicedEmail";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

const notifySchema = z.object({
	email: z.email(),
	address: z.string().trim().min(5).max(100),
});
export async function POST(req: Request) {
	try {
		// validate request body
		const body = await req.json();
		const { email, address } = notifySchema.parse(body);
		await resend.emails.send({
			from: "GeoServe <notify@geoserv.org>",
			to: email,
			subject: "We’ll notify you when we expand to your area 🚀",
			react: NotServicedEmail({ address }),
		});

		return NextResponse.json<ApiResponse<null>>(
			{
				success: true,
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error("Email send failed:", err);
		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Failed to send notification email!",
			},
			{
				status: 500,
			}
		);
	}
}
