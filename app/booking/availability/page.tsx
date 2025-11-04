"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import { useCompanyId } from "../CompanyProvider";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarDays, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getCoordinates } from "@/lib/geo";

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface SchedulePageProps {
	companyId?: string;
	embedded?: boolean;
}

export default function SchedulePage({
	companyId,
	embedded = false,
}: SchedulePageProps = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const contextCompanyId = useCompanyId();
	const effectiveCompanyId = companyId || contextCompanyId;

	const [availabilityMap, setAvailabilityMap] = useState<
		Record<string, { slots: string[]; bookedSlots: string[] }>
	>({});
	const [availableDays, setAvailableDays] = useState<string[]>([]);
	const [selectedDate, setSelectedDate] = useState<ValuePiece>(null);
	const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
		null
	);
	const [loadingDays, setLoadingDays] = useState(true);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 🧠 Use ISO strings for consistent comparison
	const availableSet = useMemo(() => new Set(availableDays), [availableDays]);

	// 🧭 Get coordinates from query param address
	useEffect(() => {
		const address = searchParams.get("address");
		if (address) {
			(async () => {
				const geo = await getCoordinates(address);
				if (geo) {
					setCoords(geo);
				} else {
					toast.error("Could not locate that address on the map.");
				}
			})();
		} else {
			toast.error("Missing address. Please go back and enter your location.");
		}
	}, [searchParams]);

	useEffect(() => {
		if (!effectiveCompanyId || !coords) return;

		async function fetchAvailability() {
			const { lat, lng } = coords!;
			try {
				setLoadingDays(true);
				setError(null);

				const today = new Date();
				const promises = Array.from({ length: 90 }).map(async (_, i) => {
					const date = new Date(today);
					date.setDate(today.getDate() + i);
					const iso = date.toISOString().split("T")[0]; // ✅ ISO-safe

					const res = await fetch(`/api/availability/${iso}`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							companyId: effectiveCompanyId,
							addressLat: lat,
							addressLng: lng,
						}),
					});

					const data = await res.json();
					return {
						dateIso: iso,
						slots: data.availableSlots || [],
					};
				});

				const results = await Promise.all(promises);
				const available: string[] = [];
				const map: Record<string, { slots: string[]; bookedSlots: string[] }> =
					{};

				results.forEach(({ dateIso, slots }) => {
					map[dateIso] = { slots, bookedSlots: [] };
					if (slots.length > 0) available.push(dateIso);
				});

				setAvailabilityMap(map);
				setAvailableDays(available);

				if (available.length === 0)
					toast.error(
						"No available dates in your area for the next two weeks."
					);

				if (available.length > 0)
					setSelectedDate(new Date(available[0] + "T00:00:00Z"));
			} catch (err: any) {
				console.error("❌ Failed to load schedule availability:", err);
				setError(err.message || "Unable to load availability.");
			} finally {
				setLoadingDays(false);
			}
		}

		fetchAvailability();
	}, [effectiveCompanyId, coords]);

	// 🕓 Slots for the selected date
	const slotsForDate = useMemo(() => {
		if (!(selectedDate instanceof Date)) return [];
		const iso = selectedDate.toISOString().split("T")[0];
		return availabilityMap[iso]?.slots || [];
	}, [selectedDate, availabilityMap]);

	function handleDateChange(value: Value) {
		const next = Array.isArray(value) ? value[0] : value;
		if (!next) return;
		setSelectedDate(next);
	}

	// 🕒 Handle slot selection
	async function handleSlotSelect(slot: string) {
		if (!(selectedDate instanceof Date) || !effectiveCompanyId) return;

		if (!coords) {
			toast.error(
				"Missing location information. Please go back and enter your address."
			);
			return;
		}

		const { lat, lng } = coords;
		const formattedDay = selectedDate.toISOString().split("T")[0];

		try {
			const res = await fetch(`/api/availability/${formattedDay}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId: effectiveCompanyId,
					addressLat: lat,
					addressLng: lng,
				}),
			});

			const data = await res.json();

			if (!data.availableSlots?.includes(slot)) {
				toast.error("That slot was just booked or unavailable in your area.");
				return;
			}

			const query = new URLSearchParams({
				day: selectedDate.toDateString(),
				slot,
			});

			if (embedded) {
				query.set("step", "details");
				router.push(`/embed/${effectiveCompanyId}?${query.toString()}`);
			} else {
				query.set("companyId", effectiveCompanyId!);
				router.push(`/booking/details?${query.toString()}`);
			}
		} catch (err) {
			console.error("❌ Failed to validate slot selection:", err);
			toast.error("Something went wrong. Please try again.");
		}
	}

	// 🌀 Loading + Error states
	if (loadingDays)
		return (
			<div className="flex justify-center items-center min-h-[60vh] text-gray-500">
				Loading availability...
			</div>
		);

	if (error)
		return (
			<div className="text-center text-red-600 mt-20">
				<p>{error}</p>
			</div>
		);

	// 🌟 Render UI
	return (
		<div className="max-w-3xl mx-auto mt-12 px-6">
			<BookingProgress currentStep="schedule" />

			{/* Heading */}
			<div className="text-center mb-10">
				<h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 bg-clip-text text-transparent">
					Choose Your Date & Time
				</h2>
				<p className="text-gray-500 mt-2 text-base">
					Select a day in your service area, then pick an available slot.
				</p>
			</div>

			{/* Calendar + Slots */}
			<div className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 p-8 rounded-3xl">
				<div className="flex flex-col items-center">
					<div className="overflow-hidden rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-[0_6px_30px_rgba(0,0,0,0.08)]">
						<Calendar
							onChange={handleDateChange}
							value={selectedDate}
							minDate={new Date()}
							tileDisabled={({ date }) => {
								const iso = date.toISOString().split("T")[0];
								return !availableSet.has(iso);
							}}
							className="!w-full !border-0 !text-gray-800 calendar-modern [&_.react-calendar__navigation]:flex [&_.react-calendar__navigation]:justify-between [&_.react-calendar__navigation]:items-center [&_.react-calendar__navigation button]:text-gray-600 [&_.react-calendar__navigation button]:rounded-xl [&_.react-calendar__navigation button:hover]:bg-blue-50 [&_.react-calendar__navigation__label]:font-semibold [&_.react-calendar__month-view__weekdays]:text-gray-400 [&_.react-calendar__month-view__weekdays]:uppercase [&_.react-calendar__month-view__weekdays]:tracking-wider [&_.react-calendar__month-view__weekdays_abbr]:no-underline"
							prev2Label={null}
							next2Label={null}
						/>
					</div>

					{selectedDate && (
						<div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mt-5 shadow-sm border border-blue-100">
							<CalendarDays className="h-4 w-4" />
							<span className="text-sm font-medium">
								{selectedDate.toLocaleDateString(undefined, {
									weekday: "short",
									month: "long",
									day: "numeric",
								})}
							</span>
						</div>
					)}
				</div>

				{/* Time Slots */}
				<div className="mt-10">
					<h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 justify-center">
						<Clock className="h-5 w-5 text-blue-500" />
						{selectedDate
							? loadingSlots
								? "Loading slots..."
								: "Available Time Slots"
							: "Pick a date first"}
					</h3>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-center">
						{selectedDate &&
							ALL_SLOTS.map((slot) => {
								const isBooked = !slotsForDate.includes(slot);
								return (
									<motion.button
										key={slot}
										whileHover={!isBooked ? { scale: 1.03 } : undefined}
										whileTap={!isBooked ? { scale: 0.97 } : undefined}
										disabled={isBooked}
										onClick={() => !isBooked && handleSlotSelect(slot)}
										className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-xl shadow-sm transition-all duration-200 ${
											isBooked
												? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
												: "bg-white hover:border-blue-400 hover:shadow-md"
										}`}
									>
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-full ${
												isBooked ? "bg-gray-200" : "bg-blue-50"
											}`}
										>
											<Clock
												className={`h-4 w-4 ${
													isBooked ? "text-gray-400" : "text-blue-600"
												}`}
											/>
										</div>
										<span className="font-medium">{slot}</span>
									</motion.button>
								);
							})}
					</div>
				</div>
			</div>

			{/* Footer Text */}
			<p className="text-center text-sm text-gray-400 mt-10">
				Availability updates every{" "}
				<span className="text-blue-500 font-medium">15 minutes</span>.
			</p>
		</div>
	);
}
