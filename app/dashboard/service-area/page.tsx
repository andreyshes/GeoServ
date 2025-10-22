"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

export default function ServiceAreaPage() {
	const [center, setCenter] = useState({ lat: 45.63, lng: -122.67 });
	const [radiusKm, setRadiusKm] = useState(30);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const companyId =
		typeof window !== "undefined" ? sessionStorage.getItem("companyId") : null;

	const { isLoaded, loadError } = useJsApiLoader({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
	});

	async function handleSave() {
		if (!companyId) {
			alert("No company ID found — please re-login or create a company.");
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
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				console.error("❌ API error:", err);
				return;
			}

			setOpen(true);
		} catch (e) {
			console.error("Error saving service area:", e);
		} finally {
			setLoading(false);
		}
	}

	if (loadError) return <div className="text-red-500">Error loading map</div>;
	if (!isLoaded)
		return <div className="text-gray-500">Loading Google Maps...</div>;

	return (
		<div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center">
			<h1 className="text-3xl font-semibold text-gray-800 mb-2 text-center">
				Service Area Settings
			</h1>
			<p className="text-gray-500 mb-8 text-center">
				Drag the marker or adjust the radius to define where your business
				serves.
			</p>

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

			<div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
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
					className="hover:bg-blue-400 hover:text-white"
				>
					{loading ? "Saving..." : "Save Area"}
				</Button>
			</div>

			{/* ✅ Modal Confirmation */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md text-center bg-white text-black">
					<DialogHeader>
						<DialogTitle className="text-green-600">
							Service Area Saved ✅
						</DialogTitle>
						<DialogDescription>
							Your changes have been successfully saved.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							className="hover:bg-blue-400 hover:text-white"
							onClick={() => setOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
