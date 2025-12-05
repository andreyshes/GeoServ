import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { isWithinServiceArea } from "@/lib/geo-utils";
import { getCoordinates } from "@/lib/geo";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

const ParamsSchema = z.object({
	day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const BodySchema = z.object({
	companyId: z.string().min(1),
	address: z.string().optional(),
	addressLat: z.number().optional(),
	addressLng: z.number().optional(),
});

type SlotCheckResponse = {
	availableSlots: string[];
	matchedAreas: Array<{
		id: string;
		name: string;
		type: string;
		availableDays: string[] | null;
	}>;
	reason?: string;
};

type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

export async function POST(
	req: Request,
	context: { params: Promise<{ day: string }> }
) {
	try {
		const { day } = ParamsSchema.parse(await context.params);
		const body = BodySchema.parse(await req.json());

		let { companyId, address, addressLat, addressLng } = body;

		if ((!addressLat || !addressLng) && address) {
			const geo = await getCoordinates(address);
			if (!geo) {
				return NextResponse.json<ApiResponse<null>>(
					{ success: false, error: "Invalid address — could not geocode" },
					{ status: 400 }
				);
			}
			addressLat = geo.lat;
			addressLng = geo.lng;
		}

		if (!addressLat || !addressLng) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Missing valid coordinates or address" },
				{ status: 400 }
			);
		}

		const serviceAreas = await db.serviceArea.findMany({
			where: { companyId },
			include: { zipCodes: true },
		});

		const matchingAreas = serviceAreas.filter((area) =>
			isWithinServiceArea(addressLat!, addressLng!, area)
		);

		if (matchingAreas.length === 0) {
			return NextResponse.json<ApiResponse<SlotCheckResponse>>({
				success: true,
				data: {
					availableSlots: [],
					matchedAreas: [],
					reason: "OUT_OF_SERVICE_AREA",
				},
			});
		}

		const weekday = new Date(`${day}T00:00:00Z`)
			.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
			.slice(0, 3);

		const allowed = matchingAreas.some((a) =>
			a.availableDays?.includes(weekday)
		);

		if (!allowed) {
			return NextResponse.json<ApiResponse<SlotCheckResponse>>({
				success: true,
				data: {
					availableSlots: [],
					matchedAreas: [],
					reason: "DAY_NOT_IN_SCHEDULE",
				},
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

		return NextResponse.json<ApiResponse<SlotCheckResponse>>({
			success: true,
			data: {
				availableSlots,
				matchedAreas: matchingAreas.map((a) => ({
					id: a.id,
					name: a.name,
					type: a.type,
					availableDays: a.availableDays,
				})),
			},
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: "Invalid request data" },
				{ status: 400 }
			);
		}

		console.error("❌ API Error:", err);
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
