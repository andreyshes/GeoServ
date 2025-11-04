// lib/geo-utils.ts
import type { ServiceArea } from "@prisma/client";

export function haversineDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Earth radius (km)
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type ZipCodeEntry = { zipCode: string };

type ServiceAreaWithRelations = ServiceArea & {
	zipCodes?: Array<ZipCodeEntry | string>;
};

interface ServiceAreaCheckOptions {
	zipCode?: string;
}

export function isWithinServiceArea(
	lat: number,
	lng: number,
	area: ServiceAreaWithRelations,
	options: ServiceAreaCheckOptions = {}
): boolean {
	switch (area.type) {
		case "RADIUS": {
			if (
				area.centerLat == null ||
				area.centerLng == null ||
				area.radiusKm == null
			) {
				return false;
			}
			const distance = haversineDistance(
				lat,
				lng,
				area.centerLat,
				area.centerLng
			);
			return distance <= area.radiusKm;
		}
		case "ZIP": {
			const zip = options.zipCode;
			if (!zip) return false;
			const zipCodes = area.zipCodes;
			if (!Array.isArray(zipCodes) || zipCodes.length === 0) return false;
			for (const entry of zipCodes) {
				if (typeof entry === "string" && entry === zip) return true;
				if (isZipCodeEntry(entry) && entry.zipCode === zip) {
					return true;
				}
			}
			return false;
		}
		case "POLYGON": {
			const polygonCoords = extractPolygonCoordinates(area.polygon);
			if (!polygonCoords) return false;
			return pointInPolygon([lng, lat], polygonCoords);
		}
		default:
			return false;
	}
}

type PolygonCoordinates = [number, number][][];

function extractPolygonCoordinates(polygon: unknown): PolygonCoordinates | null {
	if (!polygon) return null;

	let data: any = polygon;
	if (typeof polygon === "string") {
		try {
			data = JSON.parse(polygon);
		} catch {
			return null;
		}
	}

	if (Array.isArray(data)) {
		return data as PolygonCoordinates;
	}

	if (
		!data ||
		typeof data !== "object" ||
		!Array.isArray((data as any).coordinates)
	) {
		return null;
	}

	return (data as any).coordinates as PolygonCoordinates;
}

function pointInPolygon(
	point: [number, number],
	coordinates: PolygonCoordinates
): boolean {
	if (!Array.isArray(coordinates) || coordinates.length === 0) {
		return false;
	}

	const [outer, ...holes] = coordinates;
	if (!isPointInRing(point, outer)) {
		return false;
	}

	for (const hole of holes) {
		if (isPointInRing(point, hole)) {
			return false;
		}
	}

	return true;
}

function isPointInRing(
	point: [number, number],
	ring: [number, number][]
): boolean {
	if (!Array.isArray(ring) || ring.length < 3) {
		return false;
	}

	const [x, y] = point;
	let inside = false;

	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		const deltaY = yj - yi;
		if (deltaY === 0) continue;
		const intersects =
			yi > y !== yj > y &&
			x < ((xj - xi) * (y - yi)) / deltaY + xi;
		if (intersects) inside = !inside;
	}

	return inside;
}

function isZipCodeEntry(value: unknown): value is ZipCodeEntry {
	return (
		!!value &&
		typeof value === "object" &&
		"zipCode" in (value as Record<string, unknown>) &&
		typeof (value as Record<string, unknown>).zipCode === "string"
	);
}
