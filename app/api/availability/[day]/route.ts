import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";
import { getCoordinates } from "@/lib/geo";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

export async function POST(
	req: Request,
	context: { params: Promise<{ day: string }> }
) {
	try {
		const { day } = await context.params;
		const body = await req.json();

		const {
			companyId,
			address,
			addressLat,
			addressLng,
		}: {
			companyId?: string;
			address?: string;
			addressLat?: number;
			addressLng?: number;
		} = body;

		console.log("🛰️ Checking date:", day);
		console.log("📥 Incoming body:", body);

		if (!companyId || !day) {
			return NextResponse.json(
				{ error: "Missing companyId or day" },
				{ status: 400 }
			);
		}

		let lat = addressLat;
		let lng = addressLng;

		if ((!lat || !lng) && address) {
			const geo = await getCoordinates(address);
			if (!geo) {
				return NextResponse.json(
					{ error: "Invalid address — could not geocode" },
					{ status: 400 }
				);
			}
			lat = geo.lat;
			lng = geo.lng;
		}

		if (!lat || !lng) {
			return NextResponse.json(
				{ error: "Missing valid coordinates or address" },
				{ status: 400 }
			);
		}

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
			include: { zipCodes: true },
		});

		const matchingAreas = serviceAreas.filter((area) =>
			isWithinServiceArea(lat!, lng!, area)
		);

		if (matchingAreas.length === 0) {
			return NextResponse.json({
				availableSlots: [],
				reason: "OUT_OF_SERVICE_AREA",
			});
		}

		const weekday = new Date(`${day}T00:00:00Z`)
			.toLocaleDateString("en-US", {
				weekday: "short",
				timeZone: "UTC",
			})
			.slice(0, 3);

		const allowed = matchingAreas.some((a) =>
			a.availableDays?.includes(weekday)
		);

		if (!allowed) {
			return NextResponse.json({
				availableSlots: [],
				reason: "DAY_NOT_IN_SCHEDULE",
			});
		}

		const dayStart = new Date(`${day}T00:00:00Z`);
		const dayEnd = new Date(`${day}T23:59:59Z`);

		const bookings = await db.booking.findMany({
			where: {
				companyId,
				date: { gte: dayStart, lte: dayEnd },
				status: { in: ["pending", "confirmed"] },
			},
			select: { slot: true },
		});

		const bookedSlots = bookings.map((b) => b.slot);

		const availableSlots = ALL_SLOTS.filter(
			(slot) => !bookedSlots.includes(slot)
		);

		return NextResponse.json({
			availableSlots,
			matchedAreas: matchingAreas.map((a) => ({
				id: a.id,
				name: a.name,
				type: a.type,
				availableDays: a.availableDays,
			})),
		});
	} catch (err: any) {
		console.error("❌ API Error:", err);
		return NextResponse.json(
			{
				error: "Internal Server Error",
				details: err?.message,
			},
			{ status: 500 }
		);
	}
}
