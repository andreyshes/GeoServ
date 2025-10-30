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
	const [loadingDays, setLoadingDays] = useState(true);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const availableSet = useMemo(() => new Set(availableDays), [availableDays]);

	useEffect(() => {
		async function fetchAvailability() {
			try {
				setLoadingDays(true);
				setError(null);

				const res = await fetch("/api/availability", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: effectiveCompanyId,
						daysAhead: 90,
					}),
				});

				const data = await res.json();
				if (!res.ok)
					throw new Error(data.error || "Failed to load availability");

				const map: Record<string, { slots: string[]; bookedSlots: string[] }> =
					{};
				(data.availability || []).forEach(
					(entry: { date: string; slots: string[]; bookedSlots: string[] }) => {
						map[entry.date] = {
							slots: entry.slots || [],
							bookedSlots: entry.bookedSlots || [],
						};
					}
				);

				setAvailabilityMap(map);
				setAvailableDays(data.availableDays || []);

				if (data.availableDays?.length > 0) {
					const first = data.availableDays[0];
					setSelectedDate(new Date(first));
				}
			} catch (err: any) {
				console.error("❌ Failed to load schedule availability:", err);
				setError(err.message || "Unable to load availability.");
			} finally {
				setLoadingDays(false);
			}
		}

		fetchAvailability();
	}, [effectiveCompanyId]);

	const slotsForDate = useMemo(() => {
		if (!(selectedDate instanceof Date)) return [];
		const key = selectedDate.toDateString();
		return availabilityMap[key]?.slots || [];
	}, [selectedDate, availabilityMap]);

	const bookedForDate = useMemo(() => {
		if (!(selectedDate instanceof Date)) return [];
		const key = selectedDate.toDateString();
		return availabilityMap[key]?.bookedSlots || [];
	}, [selectedDate, availabilityMap]);

	function handleDateChange(value: Value) {
		const next = Array.isArray(value) ? value[0] : value;
		if (!next) return;
		setSelectedDate(next);
	}

	async function handleSlotSelect(slot: string) {
		if (!(selectedDate instanceof Date) || !effectiveCompanyId) return;

		const formattedDay = selectedDate.toISOString().split("T")[0];
		try {
			const res = await fetch(`/api/availability/${formattedDay}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId: effectiveCompanyId }),
			});
			const data = await res.json();

			if (!data.availableSlots?.includes(slot)) {
				toast.error("That slot was just booked. Please pick another.");
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

	return (
		<div className="max-w-3xl mx-auto mt-12 px-6">
			<BookingProgress currentStep="schedule" />

			{/* Heading */}
			<div className="text-center mb-10">
				<h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 bg-clip-text text-transparent">
					Choose Your Date & Time
				</h2>
				<p className="text-gray-500 mt-2 text-base">
					Select a day on the calendar, then pick an available slot below.
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
							className="!w-full !border-0 !text-gray-800 calendar-modern [&_.react-calendar__navigation]:flex [&_.react-calendar__navigation]:justify-between [&_.react-calendar__navigation]:items-center [&_.react-calendar__navigation button]:text-gray-600 [&_.react-calendar__navigation button]:rounded-xl [&_.react-calendar__navigation button:hover]:bg-blue-50 [&_.react-calendar__navigation__label]:font-semibold [&_.react-calendar__month-view__weekdays]:text-gray-400 [&_.react-calendar__month-view__weekdays]:uppercase [&_.react-calendar__month-view__weekdays]:tracking-wider [&_.react-calendar__month-view__weekdays_abbr]:no-underline"
							tileClassName={({ date, view }) => {
								if (view === "month") {
									const isToday =
										date.toDateString() === new Date().toDateString();
									const isSelected =
										selectedDate &&
										date.toDateString() === selectedDate.toDateString();

									return [
										"transition-all duration-200 rounded-xl py-2 text-sm font-medium text-center",
										isToday && "border border-blue-200 text-blue-600",
										isSelected &&
											"bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm scale-[1.02]",
										!isSelected &&
											!isToday &&
											"hover:bg-blue-50 hover:text-blue-600 text-gray-700",
									]
										.filter(Boolean)
										.join(" ");
								}
								return "";
							}}
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
								const isBooked = bookedForDate.includes(slot);
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
