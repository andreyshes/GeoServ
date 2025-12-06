import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendSMS } from "@/lib/twilio";
import { Resend } from "resend";
import BookingConfirmationEmail from "@/app/emails/BookingConfirmationEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(req: Request) {
	try {
		const token = new URL(req.url).searchParams.get("token");
		if (!token)
			return NextResponse.json({ error: "Missing token" }, { status: 400 });

		const booking = await db.booking.findFirst({
			where: { confirmationToken: token },
			include: {
				company: { select: { name: true, logoUrl: true, id: true } },
				customer: {
					select: { firstName: true, lastName: true, email: true, phone: true },
				},
			},
		});

		if (!booking)
			return NextResponse.json({ error: "Invalid token" }, { status: 404 });

		const updatedBooking = await db.booking.update({
			where: { id: booking.id },
			data: { status: "confirmed" },
			include: { customer: true, company: true },
		});

		// ✅ Send SMS confirmation (if phone exists)
		if (booking.customer?.phone) {
			const msg = `✅ Hi ${booking.customer.firstName}, your appointment with ${
				booking.company.name
			} on ${new Date(booking.date).toLocaleDateString()} at ${
				booking.slot
			} has been confirmed.`;
			await sendSMS(booking.customer.phone, msg);
		}

		if (booking.customer?.email) {
			await resend.emails.send({
				from: "GeoServ <notify@geoserv.org>",
				to: booking.customer.email,
				subject: `Your ${booking.company?.name || "GeoServ"} Booking Confirmation`,
				react: BookingConfirmationEmail({
					name: booking.customer.firstName,
					company: booking.company?.name || "GeoServ",
					service: booking.serviceType,
					date: booking.date.toLocaleString(),
					slot: booking.slot,
					ref: booking.id,
				}),
			});
			console.log(`📧 Confirmation email sent to ${booking.customer.email}`);
		}
		const supabase = await supabaseServer()
		await supabase.channel("booking-updates").send({
			type: "broadcast",
			event: "booking-updated",
			payload: {
				id: booking.id,
				companyId: booking.company.id,
				status: "confirmed",
			},
		});

		const html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Appointment Confirmed</title>
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					background: linear-gradient(135deg, #f8fafc, #eef2ff);
					display: flex;
					align-items: center;
					justify-content: center;
					height: 100vh;
					margin: 0;
				}
				.container {
					background: white;
					border-radius: 16px;
					padding: 48px 40px;
					box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
					max-width: 480px;
					text-align: center;
					border: 1px solid #e5e7eb;
				}
				img.logo {
					height: 60px;
					margin-bottom: 16px;
				}
				h1 {
					color: #16a34a;
					font-size: 26px;
					margin-bottom: 8px;
				}
				p {
					color: #4b5563;
					font-size: 16px;
					margin: 6px 0;
				}
				.details {
					background: #f9fafb;
					padding: 16px;
					margin-top: 20px;
					border-radius: 10px;
					border: 1px solid #e5e7eb;
				}
				.footer {
					margin-top: 32px;
					font-size: 13px;
					color: #9ca3af;
				}
				.btn {
					display: inline-block;
					margin-top: 24px;
					padding: 12px 24px;
					background: linear-gradient(135deg, #16a34a, #22c55e);
					color: white;
					text-decoration: none;
					border-radius: 8px;
					font-weight: 600;
					transition: opacity 0.2s;
				}
				.btn:hover {
					opacity: 0.9;
				}
			</style>
		</head>
		<body>
			<div class="container">
				${
					booking.company?.logoUrl
						? `<img src="${booking.company.logoUrl}" class="logo" alt="${booking.company.name} logo" />`
						: ""
				}
				<h1>✅ Appointment Confirmed</h1>
				<p>Thank you, <strong>${booking.customer.firstName}</strong>!</p>
				<p>Your appointment with <strong>${
					booking.company?.name ?? "our team"
				}</strong> has been successfully confirmed.</p>

				<div class="details">
					<p><strong>Service:</strong> ${booking.serviceType}</p>
					<p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
					<p><strong>Time:</strong> ${booking.slot}</p>
				</div>

				<a href="https://geoserv.org" class="btn">Return to Website</a>

				<div class="footer">
					<p>© ${new Date().getFullYear()} GeoServ. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			headers: { "Content-Type": "text/html; charset=UTF-8" },
		});
	} catch (err: any) {
		console.error("❌ Error confirming booking:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
