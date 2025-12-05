import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, startOfDay } from "date-fns";
import { z } from "zod";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

const BodySchema = z.object({
	companyId: z.string().min(1, "Company ID is required"),
	daysAhead: z.coerce.number().int().min(1).max(365).default(90),
});

function errorResponse(message: string, status = 400) {
	return NextResponse.json<ApiResponse<null>>(
		{ success: false, error: message },
		{ status }
	);
}

function groupBookings(bookings: { date: Date; slot: string }[]) {
	const map: Record<string, string[]> = {};

	for (const b of bookings) {
		const key = startOfDay(b.date).toISOString().split("T")[0];
		if (!map[key]) map[key] = [];
		map[key].push(b.slot);
	}

	return map;
}

export async function POST(req: Request) {
	try {
		const { companyId, daysAhead } = BodySchema.parse(await req.json());

		const today = startOfDay(new Date());
		const endDate = addDays(today, daysAhead);

		const bookings = await db.booking.findMany({
			where: { companyId, date: { gte: today, lt: endDate } },
			select: { date: true, slot: true },
		});

		const bookedByDate = groupBookings(bookings);

		const availability = Array.from({ length: daysAhead }, (_, i) => {
			const date = addDays(today, i);
			const iso = startOfDay(date).toISOString().split("T")[0];
			const bookedSlots = bookedByDate[iso] || [];
			const openSlots = ALL_SLOTS.filter((slot) => !bookedSlots.includes(slot));

			return {
				date: iso,
				slots: openSlots,
				bookedSlots,
			};
		});

		return NextResponse.json<ApiResponse<typeof availability>>({
			success: true,
			data: availability,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return errorResponse(err.issues[0].message, 400);
		}

		console.error("❌ /api/availability error:", err);
		return errorResponse("Internal server error", 500);
	}
}
