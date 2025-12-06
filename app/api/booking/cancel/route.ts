import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
	try {
		const token = new URL(req.url).searchParams.get("token");
		if (!token)
			return NextResponse.json({ error: "Missing token" }, { status: 400 });

		const booking = await db.booking.findFirst({
			where: { confirmationToken: token },
			include: {
				company: { select: { name: true, logoUrl: true, id: true } },
				customer: { select: { firstName: true } },
			},
		});

		if (!booking)
			return NextResponse.json({ error: "Invalid token" }, { status: 404 });

		await db.booking.update({
			where: { id: booking.id },
			data: { status: "canceled" },
		});
		const supabase = await supabaseServer();

		await supabase.channel("booking-updates").send({
			type: "broadcast",
			event: "booking-updated",
			payload: {
				id: booking.id,
				companyId: booking.company.id,
				status: "canceled",
			},
		});

		const html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Appointment Canceled</title>
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					background: linear-gradient(135deg, #fef2f2, #fee2e2);
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
					border: 1px solid #fca5a5;
				}
				img.logo {
					height: 60px;
					margin-bottom: 16px;
				}
				h1 {
					color: #dc2626;
					font-size: 26px;
					margin-bottom: 8px;
				}
				p {
					color: #4b5563;
					font-size: 16px;
					margin: 6px 0;
				}
				.details {
					background: #fef2f2;
					padding: 16px;
					margin-top: 20px;
					border-radius: 10px;
					border: 1px solid #fecaca;
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
					background: linear-gradient(135deg, #dc2626, #ef4444);
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
				${booking.company?.logoUrl ? `<img src="${booking.company.logoUrl}" class="logo" alt="${booking.company.name} logo" />` : ""}
				<h1>✖ Appointment Canceled</h1>
				<p>Hi <strong>${booking.customer.firstName}</strong>,</p>
				<p>Your appointment with <strong>${booking.company?.name ?? "our team"}</strong> has been canceled.</p>

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
		console.error("❌ Error canceling booking:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
