"use client";

import { useState, useEffect } from "react";
import {
	GoogleMap,
	CircleF,
	MarkerF,
	useJsApiLoader,
} from "@react-google-maps/api";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import ServiceAreaCard from "./ServiceAreaCard";

export default function ServiceAreaPage() {
	const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
		null
	);
	const [radiusKm, setRadiusKm] = useState(30);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [availableDays, setAvailableDays] = useState<string[]>([
		"Mon",
		"Wed",
		"Fri",
	]);
	const [areas, setAreas] = useState<any[]>([]);

	const companyId =
		typeof window !== "undefined" ? sessionStorage.getItem("companyId") : null;

	const { isLoaded, loadError } = useJsApiLoader({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
	});

	// 🧩 Load all service areas for this company
	useEffect(() => {
		async function loadAreas() {
			if (!companyId) return;
			try {
				const res = await fetch(`/api/company/${companyId}/service-area`);
				const data = await res.json();
				setAreas(data.serviceAreas || []);
			} catch (err) {
				console.error("❌ Error loading service areas:", err);
			}
		}
		loadAreas();
	}, [companyId, open]);

	// 🗺️ Load map position (first area or user location)
	useEffect(() => {
		async function loadServiceArea() {
			if (!companyId) return;

			try {
				const res = await fetch(
					`/api/company/service-area/fetch?companyId=${companyId}`
				);

				const data = await res.json();

				if (res.ok && data?.centerLat && data?.centerLng) {
					setCenter({ lat: data.centerLat, lng: data.centerLng });
					setRadiusKm(data.radiusKm || 30);
				} else if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(
						(pos) =>
							setCenter({
								lat: pos.coords.latitude,
								lng: pos.coords.longitude,
							}),
						() => setCenter({ lat: 45.52, lng: -122.68 })
					);
				} else {
					setCenter({ lat: 45.52, lng: -122.68 });
				}
			} catch (err) {
				console.error("❌ Error loading service area:", err);
				setCenter({ lat: 45.52, lng: -122.68 });
			}
		}

		loadServiceArea();
	}, [companyId]);

	async function handleSave() {
		if (!companyId) {
			alert("No company ID found — please re-login or create a company.");
			return;
		}
		if (!center) {
			alert("Map not ready yet, please wait a moment.");
			return;
		}

		try {
			setLoading(true);
			const res = await fetch("/api/company/service-area", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					type: "RADIUS",
					centerLat: center.lat,
					centerLng: center.lng,
					radiusKm,
					name: "Default Service Radius",
					availableDays,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				console.error("❌ API error:", err);
				alert("Error saving service area.");
				return;
			}

			setOpen(true);
		} catch (e) {
			console.error("Error saving service area:", e);
			alert("Something went wrong while saving.");
		} finally {
			setLoading(false);
		}
	}

	if (loadError) return <div className="text-red-500">Error loading map</div>;
	if (!isLoaded || !center)
		return (
			<div className="text-gray-500 text-center py-20">Loading map...</div>
		);

	return (
		<div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center">
			<h1 className="text-3xl font-semibold text-gray-800 mb-2 text-center">
				Service Area Settings
			</h1>
			<p className="text-gray-500 mb-8 text-center">
				Drag the marker or adjust the radius to define where your business
				serves.
			</p>

			{/* 🗺️ Map */}
			<div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-8">
				<GoogleMap
					center={center}
					zoom={10}
					mapContainerStyle={{ height: "500px", width: "100%" }}
					options={{
						mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
						clickableIcons: false,
						disableDoubleClickZoom: true,
						streetViewControl: false,
						mapTypeControl: true,
						fullscreenControl: false,
						gestureHandling: "greedy",
					}}
					onClick={(e) =>
						setCenter({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })
					}
				>
					<MarkerF
						position={center}
						draggable
						onDragEnd={(e) =>
							setCenter({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })
						}
					/>
					<CircleF
						center={center}
						radius={radiusKm * 1000}
						options={{
							fillColor: "#3b82f6",
							fillOpacity: 0.15,
							strokeColor: "#2563eb",
							strokeWeight: 2,
							strokeOpacity: 0.9,
						}}
					/>
				</GoogleMap>
			</div>

			{/* Controls */}
			<div className="flex flex-col items-center gap-8 w-full justify-center">
				{/* Weekday selector */}
				<div className="flex flex-col items-center gap-2">
					<h3 className="text-lg font-semibold text-gray-800">
						Available Days
					</h3>
					<p className="text-sm text-gray-500">
						Select which days your team provides service in this area.
					</p>

					<div className="flex flex-wrap justify-center gap-2 mt-3">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
							<button
								key={day}
								onClick={() =>
									setAvailableDays((prev) =>
										prev.includes(day)
											? prev.filter((d) => d !== day)
											: [...prev, day]
									)
								}
								className={`px-4 py-2 rounded-full border text-sm transition-all ${
									availableDays.includes(day)
										? "bg-blue-600 text-white border-blue-600"
										: "bg-gray-100 text-gray-700 border-gray-200"
								}`}
							>
								{day}
							</button>
						))}
					</div>
				</div>

				{/* Radius & Save */}
				<div className="flex flex-col sm:flex-row items-center gap-4">
					<div className="flex items-center gap-3">
						<label className="font-medium text-gray-700">Radius (km):</label>
						<input
							type="range"
							min="1"
							max="100"
							value={radiusKm}
							onChange={(e) => setRadiusKm(Number(e.target.value))}
							className="accent-blue-600 w-40"
						/>
						<span className="text-gray-700 font-medium">{radiusKm} km</span>
					</div>

					<Button
						onClick={handleSave}
						disabled={loading || !companyId}
						className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5"
					>
						{loading ? "Saving..." : "Save Area"}
					</Button>
				</div>
			</div>

			{/* ✅ Confirmation Dialog */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md text-center bg-white text-black">
					<DialogHeader>
						<DialogTitle className="text-green-600 text-lg font-semibold">
							Service Area Saved ✅
						</DialogTitle>
						<DialogDescription className="text-gray-600">
							Your service area has been successfully saved.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex justify-center">
						<Button
							className="bg-blue-600 hover:bg-blue-700 text-white"
							onClick={() => setOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Existing Service Areas */}
			{areas.length > 0 && (
				<div className="mt-16 w-full">
					<h2 className="text-2xl font-semibold text-gray-800 mb-4">
						Existing Service Areas
					</h2>
					<div className="grid gap-6">
						{areas.map((area) => (
							<ServiceAreaCard key={area.id} area={area} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
