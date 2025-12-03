"use client";

import { useEffect, useCallback } from "react";
import { Zap, Clock } from "lucide-react";

type Coordinates = google.maps.LatLngLiteral;
type GoogleMapInstance = google.maps.Map;
type MarkerInstance = google.maps.Marker;
type PolylineInstance = google.maps.Polyline;

interface MapElements {
	map: GoogleMapInstance | null;
	providerMarker: MarkerInstance | null;
	userMarker: MarkerInstance | null;
	routePolyline: PolylineInstance | null;
}

const ANIMATION_DURATION = 8000;
const MAP_ID = "premium-mini-map";
const FAKE_ESTIMATED_ETA = "4 min";
const TEST_LOCATIONS: { user: Coordinates; provider: Coordinates } = {
	user: { lat: 37.7749, lng: -122.4194 },
	provider: { lat: 37.7849, lng: -122.4094 },
};

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
	{ elementType: "geometry", stylers: [{ color: "#121212" }] },
	{ featureType: "road", stylers: [{ color: "#282828" }] },
	{ featureType: "poi", stylers: [{ visibility: "off" }] },
	{ featureType: "water", stylers: [{ color: "#1e3a8a" }] },
	{ featureType: "transit.station", stylers: [{ visibility: "off" }] },
];

export default function GeoTrekCard({
	className = "",
}: {
	className?: string;
}) {
	const mapElements: MapElements = {
		map: null,
		providerMarker: null,
		userMarker: null,
		routePolyline: null,
	};

	const addPulseCircle = useCallback(
		(position: Coordinates) => {
			if (!mapElements.map) return;
			new google.maps.Circle({
				strokeColor: "#3b82f6",
				strokeOpacity: 0.6,
				strokeWeight: 2,
				fillColor: "#3b82f6",
				fillOpacity: 0.2,
				map: mapElements.map,
				center: position,
				radius: 80,
			});
		},
		[mapElements.map]
	);

	const drawRoute = useCallback(
		(start: Coordinates, end: Coordinates) => {
			if (!mapElements.map) return;

			mapElements.routePolyline = new google.maps.Polyline({
				path: [start, end],
				geodesic: true,
				strokeColor: "#3b82f6",
				strokeOpacity: 0.7,
				strokeWeight: 4,
				icons: [
					{
						icon: {
							path: "M 0,-1 0,1",
							strokeOpacity: 1,
							scale: 3,
						},
						offset: "0",
						repeat: "15px",
					},
				],
			});

			mapElements.routePolyline.setMap(mapElements.map);
		},
		[mapElements.map]
	);

	const animateMarker = useCallback(
		(start: Coordinates, end: Coordinates) => {
			if (!mapElements.providerMarker) return;

			let startTime = performance.now();

			const step = (time: number) => {
				const progress = Math.min((time - startTime) / ANIMATION_DURATION, 1);

				const current: Coordinates = {
					lat: start.lat + (end.lat - start.lat) * progress,
					lng: start.lng + (end.lng - start.lng) * progress,
				};

				mapElements.providerMarker!.setPosition(current);

				if (progress < 1) {
					requestAnimationFrame(step);
				}
			};

			requestAnimationFrame(step);
		},
		[mapElements.providerMarker]
	);

	const initializeMap = useCallback(() => {
		if (typeof window.google === "undefined" || mapElements.map) return;

		mapElements.map = new google.maps.Map(
			document.getElementById(MAP_ID) as HTMLElement,
			{
				center: TEST_LOCATIONS.user,
				zoom: 15,
				disableDefaultUI: true,
				gestureHandling: "none",
				styles: DARK_MAP_STYLES,
			}
		);

		mapElements.userMarker = new google.maps.Marker({
			position: TEST_LOCATIONS.user,
			map: mapElements.map,
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				scale: 6,
				fillColor: "#10b981",
				fillOpacity: 1,
				strokeColor: "#065f46",
				strokeWeight: 1,
			},
		});
		addPulseCircle(TEST_LOCATIONS.user);

		mapElements.providerMarker = new google.maps.Marker({
			position: TEST_LOCATIONS.provider,
			map: mapElements.map,
			icon: {
				path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
				scale: 7,
				fillColor: "#ef4444",
				fillOpacity: 1,
				strokeColor: "#b91c1c",
				strokeWeight: 1,
			},
		});

		drawRoute(TEST_LOCATIONS.provider, TEST_LOCATIONS.user);
		animateMarker(TEST_LOCATIONS.provider, TEST_LOCATIONS.user);
	}, [mapElements, addPulseCircle, drawRoute, animateMarker]);

	useEffect(() => {
		if (typeof window !== "undefined" && window.google) {
			initializeMap();
		}
	}, [initializeMap]);

	return (
		<div
			className={`rounded-3xl border border-neutral-700 bg-neutral-950/70 backdrop-blur-md p-8 md:p-10 relative overflow-hidden shadow-2xl ${className}`}
		>
			<div className="relative z-10">
				<div className="flex justify-between items-start mb-6">
					<div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/50">
						<Zap className="h-7 w-7 stroke-[1.5]" />
					</div>
				</div>

				<h3 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
					Live Geo-Sensing Engine
				</h3>

				<p className="text-neutral-400 max-w-lg mb-8 text-lg">
					Experience **sub-second latency** tracking with smooth, interpolated
					pathing and real-time location projection.
				</p>

				<div className="w-full h-56 rounded-xl overflow-hidden border border-neutral-700 shadow-inner shadow-neutral-900/50 relative">
					<div id={MAP_ID} className="w-full h-full" />

					<div className="absolute top-4 right-4 z-20 flex items-center space-x-2 rounded-xl bg-neutral-900/70 px-3 py-2 text-sm font-semibold text-green-300 backdrop-blur-md ring-1 ring-green-600/50 shadow-lg">
						<Clock className="h-4 w-4 shrink-0" />
						<span className="text-neutral-300">ETA</span>
						<span className="font-extrabold text-white">
							{FAKE_ESTIMATED_ETA}
						</span>
					</div>
				</div>
			</div>
			<div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
		</div>
	);
}
