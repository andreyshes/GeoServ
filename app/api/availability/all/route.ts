import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";

const TOTAL_SLOTS = 5;

async function getBookedDays(companyId: string) {
	const bookings = await db.booking.findMany({
		where: { companyId },
		select: { date: true },
	});

	const countByDay: Record<string, number> = {};
	for (const b of bookings) {
		const key = b.date.toISOString().split("T")[0];
		countByDay[key] = (countByDay[key] || 0) + 1;
	}

	return Object.keys(countByDay).filter(
		(day) => countByDay[day] >= TOTAL_SLOTS
	);
}

export async function POST(req: Request) {
	try {
		const { companyId, addressLat, addressLng } = await req.json();
		if (!companyId)
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

		// 🗓 Get fully booked days
		const fullyBooked = await getBookedDays(companyId);

		// 🗺️ Get service areas
		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
		});
		const matchingAreas = serviceAreas.filter((area) =>
			addressLat && addressLng
				? isWithinServiceArea(addressLat, addressLng, area)
				: true
		);

		// 🧭 Collect allowed weekdays from matching service areas
		const allowedWeekdays = new Set(
			matchingAreas.flatMap((a) => a.availableDays || [])
		);

		// 🧮 Compute which days are actually available
		const today = new Date();
		const availableDays: string[] = [];

		for (let i = 0; i < 60; i++) {
			const date = new Date(today);
			date.setUTCDate(today.getUTCDate() + i);
			const weekday = date
				.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
				.slice(0, 3);
			const key = date.toISOString().split("T")[0];

			if (allowedWeekdays.has(weekday) && !fullyBooked.includes(key)) {
				availableDays.push(key);
			}
		}

		return NextResponse.json({ availableDays, fullyBooked });
	} catch (err) {
		console.error("Error fetching all availability:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
