"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/app/components/Stepper";
import { CalendarDays } from "lucide-react";
import { useCompanyId } from "../layout";

export default function AvailabilityPage() {
	const [days, setDays] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const companyId = useCompanyId();

	useEffect(() => {
		async function fetchAvailability() {
			try {
				setLoading(true);
				setError(null);

				if (!companyId) {
					setError("Missing company data.");
					setLoading(false);
					return;
				}

				const res = await fetch("/api/availability", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ companyId }),
				});

				const data = await res.json();
				if (!res.ok)
					throw new Error(data.error || "Failed to fetch availability");

				setDays(data.availableDays || []);
			} catch (err: any) {
				console.error("❌ Failed to load availability:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}

		fetchAvailability();
	}, [companyId]);

	if (loading)
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
		<div className="max-w-2xl mx-auto mt-12 px-6">
			<Stepper step={1} />

			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
					Select Your Service Date
				</h2>
			</div>

			{days.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{days.map((day, index) => (
						<button
							key={index}
							onClick={() =>
								router.push(
									`/booking/calendar?day=${encodeURIComponent(day)}${
										companyId ? `&companyId=${companyId}` : ""
									}`
								)
							}
							className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100">
								<CalendarDays className="h-5 w-5 text-blue-600" />
							</div>
							<span className="font-medium text-gray-800 group-hover:text-blue-600">
								{day}
							</span>
						</button>
					))}
				</div>
			) : (
				<p className="text-center text-gray-400 mt-20">
					No available service days for the next two weeks.
				</p>
			)}
		</div>
	);
}
