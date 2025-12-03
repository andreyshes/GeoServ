"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import { useCompanyId } from "../CompanyProvider";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarDays } from "lucide-react";
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
}: SchedulePageProps) {
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

	useEffect(() => {
		if (!effectiveCompanyId || !address) return;

		async function loadAvailableDays() {
			try {
				setLoadingDays(true);

				const res = await fetch("/api/availability/by-address", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						companyId: effectiveCompanyId,
						address,
					}),
				});

				const data = await res.json();

				if (!res.ok) throw new Error(data.error);

				setAvailableDays(data.availableDays || []);

				if (data.availableDays.length > 0) {
					setSelectedDate(new Date(data.availableDays[0] + "T00:00:00Z"));
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

				const data = await res.json();
				if (!res.ok) throw new Error(data.error);

				setSlots(data.availableSlots || []);
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
			<div className="flex justify-center items-center min-h-[60vh] text-gray-500">
				Loading availability...
			</div>
		);

	return (
		<div className="max-w-3xl mx-auto mt-12 px-6">
			<BookingProgress currentStep="schedule" />

			{/* Header */}
			<div className="text-center mb-10">
				<h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 bg-clip-text text-transparent">
					Choose Your Date & Time
				</h2>
				<p className="text-gray-500 mt-2">
					Available days are based on your service area.
				</p>
			</div>

			{/* Calendar */}
			<div className="bg-white/80 backdrop-blur-sm shadow-md p-8 rounded-3xl">
				<div className="flex flex-col items-center">
					<Calendar
						onChange={handleDateChange}
						value={selectedDate}
						minDate={new Date()}
						tileDisabled={({ date }) => {
							const iso = date.toISOString().split("T")[0];
							return !availableSet.has(iso);
						}}
						className="!w-full !border-0"
					/>
				</div>

				{/* Date Badge */}
				{selectedDate && (
					<div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mt-5 mx-auto w-fit border">
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

				{/* Slots */}
				<div className="mt-10">
					<h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
						{loadingSlots ? "Loading slots..." : "Available Time Slots"}
					</h3>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{ALL_SLOTS.map((slot) => {
							const disabled = !slots.includes(slot);
							return (
								<motion.button
									key={slot}
									disabled={disabled}
									whileHover={!disabled ? { scale: 1.03 } : undefined}
									onClick={() => !disabled && handleSlotSelect(slot)}
									className={`py-3 px-4 border rounded-xl ${
										disabled
											? "bg-gray-100 text-gray-400 cursor-not-allowed"
											: "bg-white hover:border-blue-400"
									}`}
								>
									<span className="font-medium">{slot}</span>
								</motion.button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
