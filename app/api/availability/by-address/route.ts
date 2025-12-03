import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";
import { getCoordinates } from "@/lib/geo";
import { addDays, startOfDay } from "date-fns";

const LOOKAHEAD_DAYS = 60;
const SLOTS_PER_DAY = 5;

export async function POST(req: Request) {
	try {
		const { companyId, address } = await req.json();

		if (!companyId || !address) {
			return NextResponse.json(
				{ error: "Missing companyId or address" },
				{ status: 400 }
			);
		}

		const coords = await getCoordinates(address);
		if (!coords) {
			return NextResponse.json({ error: "Invalid address" }, { status: 400 });
		}

		const { lat, lng } = coords!;

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
			include: { zipCodes: true },
		});

		const matchingAreas = serviceAreas.filter((area) =>
			isWithinServiceArea(lat, lng, area)
		);

		if (matchingAreas.length === 0) {
			return NextResponse.json({
				availableDays: [],
				fullyBooked: [],
				reason: "OUT_OF_SERVICE_AREA",
			});
		}

		const allowedWeekdays = new Set(
			matchingAreas.flatMap((a) => a.availableDays || [])
		);

		const today = startOfDay(new Date());
		const future = addDays(today, LOOKAHEAD_DAYS);

		const bookings = await db.booking.findMany({
			where: { companyId, date: { gte: today, lt: future } },
			select: { date: true, slot: true },
		});

		const countByDay: Record<string, number> = {};
		for (const b of bookings) {
			const key = startOfDay(b.date).toISOString().split("T")[0];
			countByDay[key] = (countByDay[key] || 0) + 1;
		}

		const fullyBookedDays = Object.keys(countByDay).filter(
			(day) => countByDay[day] >= SLOTS_PER_DAY
		);

		const availableDays: string[] = [];

		for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
			const date = addDays(today, i);
			const iso = startOfDay(date).toISOString().split("T")[0];

			const weekday = date
				.toLocaleDateString("en-US", { weekday: "short" })
				.slice(0, 3);

			if (allowedWeekdays.has(weekday) && !fullyBookedDays.includes(iso)) {
				availableDays.push(iso);
			}
		}

		return NextResponse.json({
			availableDays,
			fullyBookedDays,
			areas: matchingAreas.map((a) => ({
				id: a.id,
				name: a.name,
				availableDays: a.availableDays,
				type: a.type,
			})),
		});
	} catch (err) {
		console.error("❌ ERROR /api/availability/by-address:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
