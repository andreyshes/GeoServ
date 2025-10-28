import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "date-fns";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

export async function POST(req: Request) {
	try {
		const { companyId, daysAhead = 90 } = await req.json();

		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const today = startOfDay(new Date());
		const futureDate = addDays(today, daysAhead);

		const bookings = await db.booking.findMany({
			where: { companyId, date: { gte: today, lt: futureDate } },
			select: { date: true, slot: true },
		});

		const bookedByDate: Record<string, string[]> = {};
		for (const b of bookings) {
			const key = startOfDay(b.date).toDateString();
			if (!bookedByDate[key]) bookedByDate[key] = [];
			bookedByDate[key].push(b.slot);
		}

		const availability = Array.from({ length: daysAhead }, (_, i) => {
			const day = addDays(today, i);
			const key = day.toDateString();
			const booked = bookedByDate[key] || [];
			const openSlots = ALL_SLOTS.filter((slot) => !booked.includes(slot));
			return { date: key, slots: openSlots, bookedSlots: booked };
		});

		return NextResponse.json({
			availability,
			availableDays: availability.map((d) => d.date),
			message: "Availability generated successfully.",
		});
	} catch (err) {
		console.error("❌ /api/availability error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
