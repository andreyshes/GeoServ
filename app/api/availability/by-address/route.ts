import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWithinServiceArea } from "@/lib/geo-utils";
import { getCoordinates } from "@/lib/geo";
import { startOfDay, addDays } from "date-fns";
import { z } from "zod";

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

const LOOKAHEAD_DAYS = 60;
const SLOTS_PER_DAY = 5;


const BodySchema = z.object({
	companyId: z.string().min(1, "Company ID is required"),
	address: z.string().min(1, "Address is required"),
});

function errorResponse(message: string, status = 400) {
	return NextResponse.json<ApiResponse<null>>(
		{ success: false, error: message },
		{ status }
	);
}

async function getFullyBookedDays(
	companyId: string,
	today: Date,
	future: Date
) {
	const bookings = await db.booking.findMany({
		where: { companyId, date: { gte: today, lt: future } },
		select: { date: true },
	});

	const count: Record<string, number> = {};

	for (const b of bookings) {
		const day = startOfDay(b.date).toISOString().split("T")[0];
		count[day] = (count[day] || 0) + 1;
	}

	return Object.keys(count).filter((d) => count[d] >= SLOTS_PER_DAY);
}

function getNextAvailableDays(
	allowedWeekdays: Set<string>,
	fullyBooked: string[],
	today: Date
) {
	const result: string[] = [];

	for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
		const date = addDays(today, i);
		const iso = startOfDay(date).toISOString().split("T")[0];

		const weekday = date
			.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
			.slice(0, 3);

		if (allowedWeekdays.has(weekday) && !fullyBooked.includes(iso)) {
			result.push(iso);
		}
	}

	return result;
}

export async function POST(req: Request) {
	try {
		const { companyId, address } = BodySchema.parse(await req.json());

		const coords = await getCoordinates(address);
		if (!coords) return errorResponse("Invalid address", 400);

		const { lat, lng } = coords;

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
			include: { zipCodes: true },
		});

		const matchingAreas = serviceAreas.filter((area) =>
			isWithinServiceArea(lat, lng, area)
		);

		if (matchingAreas.length === 0) {
			return NextResponse.json<
				ApiResponse<{
					availableDays: string[];
					fullyBookedDays: string[];
					reason: string;
				}>
			>({
				success: true,
				data: {
					availableDays: [],
					fullyBookedDays: [],
					reason: "OUT_OF_SERVICE_AREA",
				},
			});
		}

		const allowedWeekdays = new Set(
			matchingAreas.flatMap((a) => a.availableDays || [])
		);

		const today = startOfDay(new Date());
		const future = addDays(today, LOOKAHEAD_DAYS);

		const fullyBookedDays = await getFullyBookedDays(companyId, today, future);

		const availableDays = getNextAvailableDays(
			allowedWeekdays,
			fullyBookedDays,
			today
		);

		return NextResponse.json<
			ApiResponse<{
				availableDays: string[];
				fullyBookedDays: string[];
				areas: {
					id: string;
					name: string;
					availableDays: string[] | null;
					type: string;
				}[];
			}>
		>({
			success: true,
			data: {
				availableDays,
				fullyBookedDays,
				areas: matchingAreas.map((a) => ({
					id: a.id,
					name: a.name,
					availableDays: a.availableDays,
					type: a.type,
				})),
			},
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return errorResponse(err.issues[0].message, 400);
		}

		console.error("❌ ERROR /api/availability/by-address:", err);
		return errorResponse("Internal server error", 500);
	}
}
