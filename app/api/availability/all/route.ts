import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";
import { z } from "zod";

const TOTAL_SLOTS = 5;

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

const bodySchema = z.object({
	companyId: z.string().min(1, "companyId is required"),
	addressLat: z.number().optional(),
	addressLng: z.number().optional(),
});

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
		const { companyId, addressLat, addressLng } = bodySchema.parse(
			await req.json()
		);

		const fullyBooked = await getBookedDays(companyId);

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
		});
		const matchingAreas = serviceAreas.filter((area) =>
			addressLat && addressLng
				? isWithinServiceArea(addressLat, addressLng, area)
				: true
		);

		const allowedWeekdays = new Set(
			matchingAreas.flatMap((a) => a.availableDays || [])
		);

		const today = new Date();
		const availableDays: string[] = [];

		for (let i = 0; i < 60; i++) {
			const date = new Date(today);
			date.setUTCDate(today.getUTCDate() + i);

			const weekday = date
				.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
				.slice(0, 3);

			const key = date.toISOString().split("T")[0];

			const isDayAllowed = allowedWeekdays.has(weekday);
			const isNotFullyBooked = !fullyBooked.includes(key);

			if (isDayAllowed && isNotFullyBooked) {
				availableDays.push(key);
			}
		}

		return NextResponse.json<
			ApiResponse<{ avaliableDays: string[]; fullyBooked: string[] }>
		>({
			success: true,
			error: "invalid request data",
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Invalid request data" },
				{ status: 400 }
			);
		}
		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
