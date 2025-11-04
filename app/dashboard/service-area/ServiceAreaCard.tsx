"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ServiceAreaCard({ area }: { area: any }) {
	const [availableDays, setAvailableDays] = useState(area.availableDays || []);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		try {
			const res = await fetch(`/api/service-area/${area.id}/update`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ availableDays }),
			});

			if (!res.ok) throw new Error("Failed to update days");
			toast.success("Service area schedule updated!");
		} catch (err) {
			toast.error("Could not save schedule.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="border rounded-xl p-5 shadow-sm bg-white">
			<h3 className="font-semibold text-lg mb-3">{area.name}</h3>

			<div className="flex flex-wrap gap-2 mb-4">
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
						className={`px-3 py-1 rounded-full text-sm border ${
							availableDays.includes(day)
								? "bg-blue-600 text-white border-blue-600"
								: "bg-gray-100 text-gray-700 border-gray-200"
						}`}
					>
						{day}
					</button>
				))}
			</div>

			<Button onClick={handleSave} disabled={saving}>
				{saving ? "Saving..." : "Save Changes"}
			</Button>
		</div>
	);
}
