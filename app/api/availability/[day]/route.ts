import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

export async function POST(
	req: Request,
	context: { params: Promise<{ day: string }> }
) {
	try {
		const { day } = await context.params;

		const { companyId } = await req.json();

		if (!companyId || !day) {
			return NextResponse.json(
				{ error: "Missing parameters" },
				{ status: 400 }
			);
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
				status: {
					in: ["pending", "confirmed"],
				},
			},
			select: { slot: true },
		});

		const bookedSlots = bookings.map((b: { slot: string }) => b.slot);
		const availableSlots = ALL_SLOTS.filter(
			(slot) => !bookedSlots.includes(slot)
		);

		return NextResponse.json({ availableSlots });
	} catch (err) {
		console.error("Error checking availability:", err);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
