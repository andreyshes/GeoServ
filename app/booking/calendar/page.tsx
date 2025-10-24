"use client";
export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Stepper from "@/app/components/Stepper";
import { CalendarDays, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast } from "sonner";
import { useCompanyId } from "../CompanyProvider";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const ALL_SLOTS = ["7–9", "9–11", "11–1", "1–3", "3–5"];

interface CalendarPageProps {
	companyId?: string;
}

export default function CalendarPage({ companyId }: CalendarPageProps) {
	const router = useRouter();
	const params = useSearchParams();
	const contextCompanyId = useCompanyId();

	const effectiveCompanyId = companyId || contextCompanyId;

	const selectedDay = params.get("day");
	const initialDate =
		selectedDay && !isNaN(Date.parse(selectedDay))
			? new Date(selectedDay)
			: new Date();

	const [date, setDate] = useState<Value>(initialDate);
	const [slots, setSlots] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	// ✅ Fetch available slots for the selected day + company
	useEffect(() => {
		if (!(date instanceof Date) || !effectiveCompanyId) return;

		const fetchSlots = async () => {
			setLoading(true);
			try {
				const formattedDay = date.toISOString().split("T")[0];
				const res = await fetch(
					`/api/availability/${encodeURIComponent(formattedDay)}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ companyId: effectiveCompanyId }),
						cache: "no-store",
					}
				);

				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to load slots");

				const available = data.availableSlots || [];

				if (available.length === 0) {
					toast.error("All slots for this date are already booked.");
				}

				setSlots(available);
			} catch (err) {
				console.error(err);
				toast.error("Error loading availability.");
			} finally {
				setLoading(false);
			}
		};

		fetchSlots();
	}, [date, effectiveCompanyId]);

	// ✅ Handle slot selection + navigation to next step
	async function handleSlotSelect(slot: string) {
		if (!(date instanceof Date) || !effectiveCompanyId) return;

		const formattedDay = date.toISOString().split("T")[0];
		const res = await fetch(
			`/api/availability/${encodeURIComponent(formattedDay)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId: effectiveCompanyId }),
				cache: "no-store",
			}
		);

		const data = await res.json();

		if (!data.availableSlots?.includes(slot)) {
			toast.error("That slot was just booked. Please pick another.");
			setSlots(data.availableSlots || []);
			return;
		}

		const query = new URLSearchParams({
			day: date.toDateString(),
			slot,
			companyId: effectiveCompanyId,
		});

		router.push(`/booking/details?${query.toString()}`);
	}

	return (
		<div className="max-w-3xl mx-auto mt-12 px-6">
			<Stepper step={2} />

			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
					Select Your Date & Time
				</h2>
				<p className="text-gray-500 mt-2">
					Choose a day from the calendar, then pick a slot below.
				</p>
			</div>

			<div className="flex flex-col items-center gap-6">
				<div className="bg-white shadow-md border border-gray-200 p-4 rounded-2xl">
					<Calendar
						onChange={setDate}
						value={date}
						minDate={new Date()}
						className="rounded-lg text-gray-800"
						prev2Label={null}
						next2Label={null}
					/>
				</div>

				{date instanceof Date && (
					<div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full">
						<CalendarDays className="h-4 w-4" />
						<span className="text-sm font-medium">{date.toDateString()}</span>
					</div>
				)}
			</div>

			<div className="mt-8">
				<h3 className="text-lg font-semibold text-gray-700 mb-4">
					{loading ? "Loading slots..." : "Available Time Slots"}
				</h3>

				{!loading && slots.length === 0 ? (
					<div className="text-center text-gray-400 py-8">
						No available slots for this date.
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{ALL_SLOTS.map((slot) => {
							const isBooked = !slots.includes(slot);
							return (
								<motion.button
									key={slot}
									whileHover={!isBooked ? { scale: 1.03 } : {}}
									whileTap={!isBooked ? { scale: 0.97 } : {}}
									disabled={isBooked}
									onClick={() => handleSlotSelect(slot)}
									className={`flex items-center gap-3 p-3 border rounded-xl transition-all duration-200 ${
										isBooked
											? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
											: "bg-white shadow-sm hover:shadow-md hover:border-blue-400"
									}`}
								>
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-full ${
											isBooked ? "bg-gray-200" : "bg-blue-50"
										}`}
									>
										<Clock className="h-4 w-4 text-blue-600" />
									</div>
									<span className="font-medium">{slot}</span>
								</motion.button>
							);
						})}
					</div>
				)}
			</div>

			<p className="text-center text-sm text-gray-400 mt-10">
				Availability updates every 15 minutes.
			</p>
		</div>
	);
}
