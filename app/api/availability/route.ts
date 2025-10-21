import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "date-fns";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

export async function POST(req: Request) {
	try {
		const { companyId } = await req.json();

		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const today = startOfDay(new Date());
		const twoWeeksLater = addDays(today, 14);

		const bookings = await db.booking.findMany({
			where: { companyId, date: { gte: today, lt: twoWeeksLater } },
			select: { date: true, slot: true },
		});

		const bookedByDate: Record<string, string[]> = {};
		for (const b of bookings) {
			const key = startOfDay(b.date).toDateString();
			if (!bookedByDate[key]) bookedByDate[key] = [];
			bookedByDate[key].push(b.slot);
		}

		const availability = Array.from({ length: 14 }, (_, i) => {
			const day = addDays(today, i);
			const key = day.toDateString();
			const booked = bookedByDate[key] || [];
			const openSlots = ALL_SLOTS.filter((slot) => !booked.includes(slot));
			return openSlots.length > 0 ? { date: key, slots: openSlots } : null;
		}).filter(Boolean) as { date: string; slots: string[] }[];

		return NextResponse.json({
			availableDays: availability.map((d) => d.date),
			availability,
			message:
				availability.length > 0
					? "Available dates generated successfully."
					: "No available days in the next two weeks.",
		});
	} catch (err) {
		console.error("❌ /api/availability error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
