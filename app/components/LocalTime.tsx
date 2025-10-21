"use client";
import { useEffect, useState } from "react";

export function LocalTimeDisplay({
	day,
	slot,
}: {
	day: string | null;
	slot: string | null;
}) {
	const [display, setDisplay] = useState("");

	useEffect(() => {
		if (!day || !slot) return;

		const decodedSlot = decodeURIComponent(slot)
			.replace(/to/gi, "–")
			.replace(/\s+/g, " ")
			.trim();

		// ✅ Normalize base date to midnight local time
		const raw = day.replace(/\+/g, " ");
		const base = new Date(raw);
		const baseDate = new Date(
			base.getFullYear(),
			base.getMonth(),
			base.getDate()
		);

		// ✅ Slot parser with explicit logic for your booking ranges
		const parseSlot = (slotStr: string, baseDate: Date) => {
			const [startStr, endStr] = slotStr.split(/–|-/).map((s) => s.trim());
			if (!startStr || !endStr) return { start: null, end: null };

			const startHour = parseInt(startStr, 10);
			const endHour = parseInt(endStr, 10);

			let startPeriod: "AM" | "PM" = "AM";
			let endPeriod: "AM" | "PM" = "AM";

			// --- Explicit inference rules ---
			if (startHour >= 7 && startHour <= 10) {
				startPeriod = "AM";
				endPeriod = "AM";
			} else if (startHour === 11) {
				startPeriod = "AM";
				endPeriod = "PM"; // 11–1 crosses noon
			} else if (startHour >= 1 && startHour <= 7) {
				startPeriod = "PM";
				endPeriod = "PM";
			}

			const makeTime = (h: number, period: string) => {
				let hour = h;
				if (period === "PM" && hour < 12) hour += 12;
				if (period === "AM" && hour === 12) hour = 0;

				const d = new Date(baseDate);
				d.setHours(hour, 0, 0, 0);
				return d;
			};

			const start = makeTime(startHour, startPeriod);
			const end = makeTime(endHour, endPeriod);
			return { start, end };
		};

		const { start, end } = parseSlot(decodedSlot, baseDate);
		if (!start || !end) return;

		const dateStr = start.toLocaleDateString(undefined, {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		});

		const startTime = start.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
		const endTime = end.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});

		setDisplay(`${dateStr} • ${startTime} – ${endTime}`);
	}, [day, slot]);

	return <span>{display}</span>;
}
