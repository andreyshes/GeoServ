"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import { useCompanyId } from "../CompanyProvider";
import Calendar, { CalendarType } from "react-calendar";
import "react-calendar/dist/Calendar.css"; // We will override this CSS
import { CalendarDays, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Assuming ALL_SLOTS and types are defined correctly
const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface SchedulePageProps {
	companyId?: string;
	embedded?: boolean;
}

// --- Component Start ---

export default function SchedulePage({
	companyId,
	embedded = false,
}: SchedulePageProps) {
	// --- LOGIC (UNTOUCHED) ---
	const router = useRouter();
	const searchParams = useSearchParams();
	const contextCompanyId = useCompanyId();
	const effectiveCompanyId = companyId || contextCompanyId;

	const [availableDays, setAvailableDays] = useState<string[]>([]);
	const [selectedDate, setSelectedDate] = useState<ValuePiece>(null);
	const [slots, setSlots] = useState<string[]>([]);
	const [loadingDays, setLoadingDays] = useState(true);
	const [loadingSlots, setLoadingSlots] = useState(false);

	const address = searchParams.get("address");
	const availableSet = useMemo(() => new Set(availableDays), [availableDays]);

	// useEffect for loading available days... (logic remains the same)
	useEffect(() => {
		if (!effectiveCompanyId || !address) return;

		async function loadAvailableDays() {
			try {
				setLoadingDays(true);
				// ... API call to /api/availability/by-address ...
				const res = await fetch("/api/availability/by-address", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: effectiveCompanyId,
						address,
					}),
				});

				const json = await res.json();

				if (!json.success) {
					throw new Error(json.error || "Failed to load availability");
				}

				const availableDays = json.data.availableDays;

				setAvailableDays(availableDays);

				if (availableDays.length > 0) {
					setSelectedDate(new Date(availableDays[0] + "T00:00:00Z"));
				} else {
					toast.error("No available service days for your location.");
				}
			} catch (err: any) {
				toast.error(err.message || "Failed to load availability.");
			} finally {
				setLoadingDays(false);
			}
		}

		loadAvailableDays();
	}, [effectiveCompanyId, address]);

	// useEffect for loading slots... (logic remains the same)
	useEffect(() => {
		if (!(selectedDate instanceof Date)) return;
		if (!availableDays.length) return;

		const iso = selectedDate.toISOString().split("T")[0];

		if (!availableSet.has(iso)) {
			setSlots([]);
			return;
		}

		async function loadSlots() {
			try {
				setLoadingSlots(true);

				const res = await fetch(`/api/availability/${iso}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: effectiveCompanyId,
						address,
					}),
				});

				const json = await res.json();

				if (!json.success) {
					throw new Error(json.error || "Failed to load slots");
				}

				setSlots(json.data.availableSlots);
			} catch (err) {
				toast.error("Failed to load time slots");
			} finally {
				setLoadingSlots(false);
			}
		}

		loadSlots();
	}, [selectedDate, availableDays, effectiveCompanyId, address, availableSet]);

	const handleDateChange = (value: Value) => {
		const next = Array.isArray(value) ? value[0] : value;
		if (!next) return;
		setSelectedDate(next);
	};

	async function handleSlotSelect(slot: string) {
		if (!selectedDate || !slots.includes(slot)) {
			toast.error("Slot is no longer available.");
			return;
		}

		const query = new URLSearchParams({
			companyId: effectiveCompanyId!,
			day: selectedDate.toDateString(),
			slot,
		});

		if (embedded) {
			query.set("step", "details");
			router.push(`/embed/${effectiveCompanyId}?${query.toString()}`);
		} else {
			router.push(`/booking/details?${query.toString()}`);
		}
	}

	if (loadingDays)
		return (
			<div className="min-h-screen bg-neutral-950 flex justify-center items-center text-white/70">
				<Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-500" />
				<span className="text-lg">Loading service availability...</span>
			</div>
		);

	return (
		<div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 flex flex-col items-center pt-16">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-4xl mx-auto relative z-10"
			>
				<BookingProgress currentStep="schedule" />

				<div className="text-center mb-10 mt-6">
					<h2 className="text-4xl font-extrabold tracking-tight text-white">
						Choose Your Date & Time
					</h2>
					<p className="text-neutral-400 mt-2 text-lg">
						Select a service time that works best for you.
					</p>
				</div>

				{/* Main Card Container - Sharp, Defined Edges */}
				<div className="bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-xl overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
					<div className="p-6 sm:p-8 lg:w-3/5">
						<h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
							<CalendarDays className="h-5 w-5 text-blue-500" />
							Select a Date
						</h3>

						<Calendar
							onChange={handleDateChange}
							value={selectedDate}
							minDate={new Date()}
							tileDisabled={({ date }) => {
								const iso = date.toISOString().split("T")[0];
								return !availableSet.has(iso);
							}}
							className="w-full border-0 p-0 text-white/90 custom-dark-calendar"
							calendarType="gregory"
							prev2Label={null}
							next2Label={null}
						/>
					</div>

					<div className="p-6 sm:p-8 lg:w-2/5 bg-neutral-800">
						<h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
							<Loader2
								className={`h-5 w-5 ${loadingSlots ? "animate-spin text-blue-500" : "text-transparent"}`}
							/>
							Available Time Slots
						</h3>

						{selectedDate && (
							<div className="bg-neutral-700 text-white/90 px-4 py-2 rounded-lg mb-6 w-full text-center">
								<span className="font-medium">
									{selectedDate.toLocaleDateString(undefined, {
										weekday: "long",
										month: "long",
										day: "numeric",
									})}
								</span>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							{ALL_SLOTS.map((slot) => {
								const disabled = !slots.includes(slot);
								const isSelected =
									selectedDate &&
									selectedDate.toDateString() === new Date().toDateString() &&
									slot === "7–9";

								return (
									<motion.button
										key={slot}
										disabled={disabled || loadingSlots}
										whileHover={
											!disabled && !loadingSlots ? { scale: 1.02 } : undefined
										}
										whileTap={!disabled ? { scale: 0.98 } : undefined}
										onClick={() =>
											!disabled && !loadingSlots && handleSlotSelect(slot)
										}
										className={`py-3 px-4 rounded-xl font-medium transition-all text-sm shadow-md
    ${
			loadingSlots
				? "bg-neutral-700/50 text-neutral-500 cursor-wait"
				: disabled
					? "bg-neutral-900 text-neutral-600 border border-neutral-700 cursor-not-allowed line-through"
					: "bg-blue-600 text-white hover:bg-blue-500"
		}
  `}
									>
										{slot}
									</motion.button>
								);
							})}
						</div>

						{slots.length === 0 && !loadingSlots && (
							<p className="text-neutral-500 text-center mt-6">
								No slots available for this day.
							</p>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
}
