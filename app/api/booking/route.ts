import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
			{
				headers: {
					"User-Agent": "GeoServ/1.0 (support@geoserv.org)",
				},
			}
		);
		const data = await res.json();
		return data.display_name || `${lat}, ${lng}`;
	} catch (err) {
		console.error("❌ Failed to get address:", err);
		return `${lat}, ${lng}`;
	}
}

function isValidCoordinates(loc: any): loc is { lat: number; lng: number } {
	return (
		loc &&
		typeof loc.lat === "number" &&
		typeof loc.lng === "number" &&
		loc.lat !== null &&
		loc.lng !== null
	);
}

export async function POST(req: Request) {
	try {
		const data = await req.json();
		const {
			companyId,
			date,
			slot,
			serviceType,
			firstName,
			lastName,
			email,
			phone,
			address: rawAddress,
			location,
		} = data;

		if (!companyId || !date || !slot || !serviceType || !email) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const bookingDate = new Date(date);
		if (isNaN(bookingDate.getTime())) {
			return NextResponse.json(
				{ error: "Invalid date format" },
				{ status: 400 }
			);
		}

		const existing = await db.booking.findFirst({
			where: { companyId, date: bookingDate, slot },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "This time slot has already been booked" },
				{ status: 409 }
			);
		}

		const service = await db.service.findFirst({
			where: { name: serviceType, companyId },
		});

		let address: string | null = rawAddress ?? null;
		let lat: number | null = null;
		let lng: number | null = null;

		if (!address && isValidCoordinates(location)) {
			lat = location.lat;
			lng = location.lng;
			address = await getAddressFromCoords(lat, lng);
		} else if (isValidCoordinates(location)) {
			lat = location.lat;
			lng = location.lng;
		}

		const booking = await db.booking.create({
			data: {
				serviceType,
				date: bookingDate,
				slot,
				status: "pending",
				paid: false,
				address,
				addressLat: lat,
				addressLng: lng,
				amountCents: service?.priceCents ?? 10000,
				confirmationToken: randomUUID(),
				company: { connect: { id: companyId } },
				customer: {
					connectOrCreate: {
						where: { email },
						create: { firstName, lastName, email, phone },
					},
				},
			},
			include: { customer: true, company: true },
		});

		return NextResponse.json({ success: true, booking });
	} catch (err: any) {
		if (err.code === "P2002") {
			return NextResponse.json(
				{ error: "This slot was just booked by someone else" },
				{ status: 409 }
			);
		}

		console.error("❌ Booking creation failed:", err);
		return NextResponse.json(
			{ error: err.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
