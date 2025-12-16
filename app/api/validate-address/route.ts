import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCoordinates } from "@/lib/geo";
import { z } from "zod";
import { type ApiResponse } from "@/lib/type";

const addressSchema = z.object({
	address: z.string().min(1, "Address is required"),
});

function errorResponse(message: string, status = 400) {
	return NextResponse.json<ApiResponse<null>>(
		{ success: false, error: message },
		{ status }
	);
}

export async function POST(req: Request) {
	try {
		const { address } = addressSchema.parse(await req.json());

		const coords = await getCoordinates(address);

		if (!coords) {
			return errorResponse("Invalid address", 400);
		}

		const { lat, lng } = coords;

		const areas = await db.serviceArea.findMany({
			include: { zipCodes: true, company: true },
		});

		for (const area of areas) {
			switch (area.type) {
				case "RADIUS": {
					if (area.centerLat && area.centerLng && area.radiusKm) {
						const distance = haversineDistance(
							{ lat, lng },
							{ lat: area.centerLat, lng: area.centerLng }
						);
						if (distance <= area.radiusKm) {
							return NextResponse.json({
								valid: true,
								company: area.company,
								areaName: area.name,
								location: { lat, lng },
							});
						}
					}
					break;
				}
				case "POLYGON": {
					if (area.polygon) {
						const polygonData =
							typeof area.polygon === "string"
								? JSON.parse(area.polygon)
								: (area.polygon as any);

						if (polygonData?.coordinates?.[0]) {
							const inside = pointInPolygon(
								[lng, lat],
								polygonData.coordinates[0]
							);
							if (inside) {
								return NextResponse.json({
									valid: true,
									company: area.company,
									areaName: area.name,
								});
							}
						}
					}
					break;
				}
				case "ZIP": {
					const zip = await reverseLookupZip(lat, lng);
					if (area.zipCodes.some((z) => z.zipCode === zip)) {
						return NextResponse.json({
							valid: true,
							company: area.company,
							areaName: area.name,
						});
					}
					break;
				}
			}
		}

		return NextResponse.json({ valid: false });
	} catch (err) {
		if (err instanceof z.ZodError) {
			return errorResponse(err.issues[0].message, 400);
		}
	}
}

function haversineDistance(
	p1: { lat: number; lng: number },
	p2: { lat: number; lng: number }
) {
	const R = 6371; // Earth radius in km
	const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
	const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((p1.lat * Math.PI) / 180) *
			Math.cos((p2.lat * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(point: [number, number], vs: [number, number][]) {
	const [x, y] = point;
	let inside = false;
	for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		const [xi, yi] = vs[i];
		const [xj, yj] = vs[j];
		const intersect =
			yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

async function reverseLookupZip(lat: number, lng: number) {
	const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
	const res = await fetch(url);
	const data = await res.json();
	const zipComp = data.results[0]?.address_components?.find((c: any) =>
		c.types.includes("postal_code")
	);
	return zipComp?.long_name || null;
}
