import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import BookingConfirmationEmail from "@/app/emails/BookingConfirmationEmail";
import { getCoordinates } from "@/lib/geo";

const resend = new Resend(process.env.RESEND_API_KEY!);

async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
			{
				headers: { "User-Agent": "GeoServ/1.0 (support@geoserv.org)" },
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

function haversineDistance(
	p1: { lat: number; lng: number },
	p2: { lat: number; lng: number }
) {
	const R = 6371; // km
	const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
	const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((p1.lat * Math.PI) / 180) *
			Math.cos((p2.lat * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
			paymentMethod,
		} = data;

		console.log("📦 Incoming booking data:", data);

		if (!companyId || !date || !slot || !serviceType || !email) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const bookingDate = new Date(date);
		bookingDate.setMinutes(
			bookingDate.getMinutes() - bookingDate.getTimezoneOffset()
		);

		const existing = await db.booking.findFirst({
			where: { companyId, date: bookingDate, slot },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "This time slot has already been booked" },
				{ status: 409 }
			);
		}

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
		} else if (address && !lat && !lng) {
			const coords = await getCoordinates(address);
			if (coords) {
				lat = coords.lat;
				lng = coords.lng;
			}
		}

		if (!lat || !lng) {
			return NextResponse.json(
				{ error: "Unable to determine coordinates for address" },
				{ status: 400 }
			);
		}

		const serviceArea = await db.serviceArea.findFirst({
			where: { companyId },
		});

		if (
			serviceArea?.centerLat &&
			serviceArea?.centerLng &&
			serviceArea?.radiusKm
		) {
			const distance = haversineDistance(
				{ lat, lng },
				{ lat: serviceArea.centerLat, lng: serviceArea.centerLng }
			);

			if (distance > serviceArea.radiusKm) {
				console.warn(
					`❌ Address (${lat},${lng}) is outside company radius (${distance.toFixed(
						2
					)} km > ${serviceArea.radiusKm} km)`
				);
				return NextResponse.json(
					{ error: "Address outside of service area", distanceKm: distance },
					{ status: 400 }
				);
			}
		}

		const service = await db.service.findFirst({
			where: { name: serviceType, companyId },
		});

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

		if (paymentMethod === "arrival") {
			await db.booking.update({
				where: { id: booking.id },
				data: { status: "confirmed" },
			});

			if (booking.customer?.email) {
				try {
					await resend.emails.send({
						from: "GeoServ <notify@geoserv.org>",
						to: booking.customer.email,
						subject: `Your ${booking.company?.name || "GeoServ"} Booking Confirmation`,
						react: BookingConfirmationEmail({
							name: booking.customer.firstName,
							company: booking.company?.name || "GeoServ",
							service: booking.serviceType,
							date: new Date(booking.date).toLocaleDateString(undefined, {
								month: "long",
								day: "numeric",
								year: "numeric",
							}),
							slot: booking.slot,
							ref: booking.id,
							receiptUrl: undefined,
						}),
					});
					console.log(
						`📧 Confirmation email sent to ${booking.customer.email}`
					);
				} catch (emailErr) {
					console.error("⚠️ Failed to send confirmation email:", emailErr);
				}
			}
		}

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
