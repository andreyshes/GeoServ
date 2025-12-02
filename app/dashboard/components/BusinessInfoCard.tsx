"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import { getCoordinates } from "@/lib/geo";

interface BusinessInfoCardProps {
	companyId: string;
}

export default function BusinessInfoCard({ companyId }: BusinessInfoCardProps) {
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editMode, setEditMode] = useState(false);

	const addressInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!companyId) return;

		(async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/company/${companyId}`);
				if (!res.ok) throw new Error("Failed to load company info");
				const data = await res.json();
				setName(data.name || "");
				setAddress(data.address || "");
			} catch (err) {
				console.error("❌ Error loading company:", err);
				toast.error("Could not load company details.");
			} finally {
				setLoading(false);
			}
		})();
	}, [companyId]);

	useEffect(() => {
		if (!editMode || !addressInputRef.current) return;
		if (!(window as any).google) return;

		const autocomplete = new (window as any).google.maps.places.Autocomplete(
			addressInputRef.current,
			{ types: ["geocode"], fields: ["formatted_address", "geometry"] }
		);

		autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace();
			if (!place.formatted_address || !place.geometry) return;

			setAddress(place.formatted_address);
			toast.success("📍 Address selected!");
		});

		return () => {
			(window as any).google.maps.event.clearInstanceListeners(autocomplete);
		};
	}, [editMode]);

	async function handleSave() {
		if (!name.trim() || !address.trim()) {
			toast.error("Please fill out both name and address.");
			return;
		}

		setSaving(true);
		try {
			const coords = await getCoordinates(address);
			if (!coords) throw new Error("Could not find coordinates.");

			const res = await fetch("/api/company/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					name,
					address,
					addressLat: coords.lat,
					addressLng: coords.lng,
				}),
			});

			if (!res.ok) throw new Error("Failed to save company info");

			toast.success("✅ Business information updated successfully!");
			setEditMode(false);
		} catch (err) {
			console.error("❌ Save error:", err);
			toast.error("Something went wrong while saving.");
		} finally {
			setSaving(false);
		}
	}

	if (loading)
		return (
			<div className="rounded-xl border bg-white p-6 text-gray-500 text-center">
				Loading business information...
			</div>
		);

	return (
		<section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
						🏢 Business Information
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Manage your company name and address for accurate service-area
						mapping.
					</p>
				</div>

				{!editMode && (
					<Button variant="outline" onClick={() => setEditMode(true)}>
						Edit
					</Button>
				)}
			</div>

			{!editMode ? (
				<div className="space-y-3 text-gray-700">
					<div>
						<span className="text-sm text-gray-500 block">Company Name</span>
						<span className="font-medium">{name || "—"}</span>
					</div>
					<div>
						<span className="text-sm text-gray-500 block">
							Business Address
						</span>
						<span className="font-medium">{address || "—"}</span>
					</div>
				</div>
			) : (
				<div className="space-y-5 mt-2">
					<div>
						<label className="text-sm font-medium text-gray-700">
							Company Name
						</label>
						<Input
							placeholder="Example: Sparkle Cleaners"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1"
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700">
							Business Address
						</label>
						<Input
							ref={addressInputRef}
							placeholder="Start typing your address..."
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							className="mt-1"
						/>
					</div>

					<div className="flex gap-2 pt-2">
						<Button
							onClick={handleSave}
							disabled={saving}
							className="bg-blue-600 hover:bg-blue-700 text-white"
						>
							{saving ? "Saving..." : "Save Changes"}
						</Button>
						<Button
							variant="outline"
							onClick={() => setEditMode(false)}
							disabled={saving}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
		</section>
	);
}
