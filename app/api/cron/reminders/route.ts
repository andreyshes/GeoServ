import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReminderEmail } from "@/lib/notifications";

export async function GET() {
	try {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(now.getDate() + 1);

		const start = new Date(
			tomorrow.getFullYear(),
			tomorrow.getMonth(),
			tomorrow.getDate(),
			0,
			0,
			0
		);
		const end = new Date(
			tomorrow.getFullYear(),
			tomorrow.getMonth(),
			tomorrow.getDate(),
			23,
			59,
			59
		);

		const bookings = await db.booking.findMany({
			where: {
				status: "confirmed",
				date: { gte: start, lte: end },
			},
			include: {
				customer: true,
				company: true,
			},
		});

		console.log(`📅 Sending ${bookings.length} reminder emails`);

		for (const b of bookings) {
			await sendReminderEmail({
				to: b.customer.email,
				name: b.customer.firstName,
				company: b.company.name,
				service: b.serviceType,
				date: b.date.toISOString(),
				slot: b.slot,
				ref: b.confirmationToken!,
			});
		}

		await sendReminderEmail({
			to: "shestopalandreyy@gmail.com",
			name: "Andrey",
			company: "CleanPro Services",
			service: "Home Cleaning",
			date: new Date().toISOString(),
			slot: "2:00–4:00 PM",
			ref: "cmh0u1h700007v7rlikhfkwap",
		});
		console.log("✅ Test reminder email sent to youremail@example.com");

		return NextResponse.json({
			success: true,
			sent: bookings.length,
		});
	} catch (err: any) {
		console.error("❌ Reminder cron failed:", err);
		return NextResponse.json(
			{ error: err.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
