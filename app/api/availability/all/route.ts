import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getBookedDays(companyId: string) {
	const bookings = await db.booking.findMany({
		where: { companyId },
		select: { date: true },
	});

	const countByDay: Record<string, number> = {};
	bookings.forEach((b) => {
		const dayKey = b.date.toISOString().split("T")[0];
		countByDay[dayKey] = (countByDay[dayKey] || 0) + 1;
	});

	const TOTAL_SLOTS = 5;
	return Object.keys(countByDay).filter(
		(day) => countByDay[day] >= TOTAL_SLOTS
	);
}

// ✅ POST — used by your app normally
export async function POST(req: Request) {
	try {
		const { companyId } = await req.json();
		if (!companyId)
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

		const bookedDays = await getBookedDays(companyId);
		return NextResponse.json({ bookedDays });
	} catch (err) {
		console.error("Error fetching booked days:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// ✅ GET — for testing in browser or if you ever want to fetch via query params
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const companyId = searchParams.get("companyId");

		if (!companyId)
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

		const bookedDays = await getBookedDays(companyId);
		return NextResponse.json({ bookedDays });
	} catch (err) {
		console.error("Error fetching booked days:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
