import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import NotServicedEmail from "@/app/emails/NotServicedEmail";

export async function POST(req: Request) {
	try {
		const { email, address } = await req.json();
		console.log("📩 Notify route triggered for:", email, address);
		if (!email || !address) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		await resend.emails.send({
			from: "GeoServe <notify@geoserv.org>",
			to: email,
			subject: "We’ll notify you when we expand to your area 🚀",
			react: NotServicedEmail({ address }),
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Email send failed:", err);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 }
		);
	}
}
