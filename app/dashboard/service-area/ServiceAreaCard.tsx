"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ServiceAreaCard({ area }: { area: any }) {
	const [availableDays, setAvailableDays] = useState(area.availableDays || []);
	const [radiusKm, setRadiusKm] = useState(area.radiusKm ?? 30);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [locationName, setLocationName] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState(area.updatedAt || null);

	// Reverse-geocode coordinates → readable label
	useEffect(() => {
		async function fetchLocation() {
			if (!area.centerLat || !area.centerLng) return;
			try {
				const res = await fetch(
					`https://maps.googleapis.com/maps/api/geocode/json?latlng=${area.centerLat},${area.centerLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
				);
				const data = await res.json();
				setLocationName(
					data.results?.[0]?.formatted_address || "Unknown location"
				);
			} catch {
				setLocationName("Unknown location");
			}
		}
		fetchLocation();
	}, [area.centerLat, area.centerLng]);

	async function handleSave() {
		setSaving(true);
		setSaved(false);
		try {
			const res = await fetch(`/api/service-area/${area.id}/update`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ availableDays, radiusKm }),
			});

			if (!res.ok) throw new Error("Failed to update area");

			const now = new Date().toISOString();
			setLastUpdated(now);
			setSaved(true);
			toast.success("✅ Service area updated!");
		} catch {
			toast.error("❌ Could not save changes.");
		} finally {
			setSaving(false);
			setTimeout(() => setSaved(false), 2000);
		}
	}

	return (
		<div className="border rounded-2xl p-5 shadow-sm bg-white flex flex-col gap-4 relative overflow-hidden">
			<AnimatePresence>
				{saving && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]"
					>
						<span className="text-gray-500 text-sm">Saving...</span>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="font-semibold text-lg text-gray-800">
						{area.name || "Unnamed Service Area"}
					</h3>
					<p className="text-sm text-gray-500">
						📍 {locationName || "Loading..."} • 📏 {radiusKm} km radius
					</p>
				</div>
				{area.centerLat && area.centerLng && (
					<img
						src={`https://maps.googleapis.com/maps/api/staticmap?center=${area.centerLat},${area.centerLng}&zoom=10&size=250x120&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&markers=color:blue|${area.centerLat},${area.centerLng}`}
						alt="Map preview"
						className="rounded-lg border shadow-sm mt-3 sm:mt-0"
					/>
				)}
			</div>

			<div>
				<label className="text-sm font-medium text-gray-700 mb-2 block">
					Available Days
				</label>
				<div className="flex flex-wrap gap-2">
					{DAYS.map((day) => (
						<button
							key={day}
							onClick={() =>
								setAvailableDays((prev: any) =>
									prev.includes(day)
										? prev.filter((d: any) => d !== day)
										: [...prev, day]
								)
							}
							className={`px-3 py-1 rounded-full text-sm border transition-colors ${
								availableDays.includes(day)
									? "bg-blue-600 text-white border-blue-600"
									: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
							}`}
						>
							{day}
						</button>
					))}
				</div>
			</div>

			<div>
				<label className="text-sm font-medium text-gray-700 mb-1 block">
					Radius: {radiusKm} km
				</label>
				<input
					type="range"
					min={1}
					max={100}
					value={radiusKm}
					onChange={(e) => setRadiusKm(Number(e.target.value))}
					className="w-full accent-blue-600"
				/>
			</div>

			<div className="flex items-center gap-3">
				<Button onClick={handleSave} disabled={saving} className="self-start">
					{saving ? "Saving..." : "Save Changes"}
				</Button>
				<AnimatePresence>
					{saved && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ duration: 0.3 }}
							className="flex items-center gap-1 text-green-600 text-sm"
						>
							<CheckCircle2 size={18} />
							<span>Saved</span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{lastUpdated && (
				<p className="text-xs text-gray-400 mt-2">
					Last updated — {new Date(lastUpdated).toLocaleString()}
				</p>
			)}
		</div>
	);
}
