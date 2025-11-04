import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

export async function POST(
	req: Request,
	context: { params: Promise<{ day: string }> }
) {
	try {
		const { day } = await context.params;
		const { companyId, addressLat, addressLng } = await req.json();
		console.log("🛰️ Checking availability for:", day);
		console.log("📍 Input:", { companyId, addressLat, addressLng });

		if (!companyId || !day || !addressLat || !addressLng) {
			return NextResponse.json(
				{ error: "Missing parameters" },
				{ status: 400 }
			);
		}

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
		});
		console.log(
			"🗺️ Areas:",
			serviceAreas.map((a) => ({
				name: a.name,
				type: a.type,
				centerLat: a.centerLat,
				centerLng: a.centerLng,
				radiusKm: a.radiusKm,
				availableDays: a.availableDays,
			}))
		);

		// 🔍 Check if user coordinates fall inside any area
		const matchingAreas = serviceAreas.filter((area) =>
			isWithinServiceArea(addressLat, addressLng, area)
		);

		if (matchingAreas.length === 0) {
			// User not in any service area
			return NextResponse.json({ availableSlots: [] });
		}

		const weekday = new Date(`${day}T00:00:00Z`)
			.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
			.slice(0, 3);

		console.log("🧭 Checking date:", day, "→ weekday:", weekday);

		console.log("🧭 Checking date:", day, "→ weekday:", weekday);

		const areaMatchesSchedule = matchingAreas.some((a) =>
			a.availableDays?.includes(weekday)
		);

		if (!areaMatchesSchedule) {
			return NextResponse.json({ availableSlots: [] });
		}

		const dayStart = new Date(`${day}T00:00:00Z`);
		const dayEnd = new Date(`${day}T23:59:59Z`);

		const bookings = await db.booking.findMany({
			where: {
				companyId,
				date: {
					gte: dayStart,
					lte: dayEnd,
				},
				status: { in: ["pending", "confirmed"] },
			},
			select: { slot: true },
		});

		const bookedSlots = bookings.map((b) => b.slot);
		const availableSlots = ALL_SLOTS.filter(
			(slot) => !bookedSlots.includes(slot)
		);
		console.log("📅 Weekday:", weekday);
		console.log(
			"🕓 AvailableDays:",
			matchingAreas.map((a) => a.availableDays)
		);
		console.log("🎯 Returning:", availableSlots);

		return NextResponse.json({ availableSlots });
	} catch (err: any) {
		console.error("❌ Error checking availability:", err);
		if (err instanceof Error) {
			console.error("🔍 Stack:", err.stack);
		}
		return NextResponse.json(
			{ error: err?.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
