import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import BookingConfirmationEmail from "@/app/emails/BookingConfirmationEmail";

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
