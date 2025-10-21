"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stepper from "@/app/components/Stepper";
import { motion } from "framer-motion";
import { Briefcase, Loader2 } from "lucide-react";
import { useCompanyId } from "../CompanyProvider";
import { LocalTimeDisplay } from "@/app/components/LocalTime";

interface Service {
	id: string;
	name: string;
	priceCents: number;
	durationText: string;
}

interface ServicesResponse {
	services: Service[];
	error?: string;
}

export default function DetailsPage() {
	const [form, setForm] = useState({
		first: "",
		last: "",
		phone: "",
		email: "",
		service: "",
	});
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter();
	const params = useSearchParams();
	const companyId = useCompanyId();

	const day = params.get("day");
	const slot = params.get("slot");

	useEffect(() => {
		if (!companyId) return;
		let isMounted = true;

		async function fetchServices() {
			try {
				const res = await fetch(`/api/company/${companyId}/services`);
				if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
				const data: ServicesResponse = await res.json();

				if (!isMounted) return;
				if (data.error) throw new Error(data.error);

				const uniqueServices = Array.from(
					new Map(data.services.map((s) => [s.name, s])).values()
				);
				setServices(uniqueServices);
			} catch (err: any) {
				console.error("❌ Error loading services:", err);
				if (isMounted) setError(err.message);
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		fetchServices();
		return () => {
			isMounted = false;
		};
	}, [companyId]);

	function handleChange(
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}

	function parseTime(timeStr: string, baseDate: Date): Date | null {
		const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
		if (!match) return null;

		let [, h, m, period] = match;
		let hour = parseInt(h, 10);
		const minute = m ? parseInt(m, 10) : 0;

		if (!period) period = "AM";

		if (/pm/i.test(period) && hour < 12) hour += 12;
		if (/am/i.test(period) && hour === 12) hour = 0;

		const local = new Date(
			baseDate.getFullYear(),
			baseDate.getMonth(),
			baseDate.getDate(),
			hour,
			minute,
			0,
			0
		);
		return local;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!companyId || !day || !slot) {
			alert("Missing booking details—cannot complete booking.");
			return;
		}

		const [startTimeRaw] = slot.split("–") || ["00:00"];
		const startTimeStr = startTimeRaw.trim();
		const localDate = new Date(day.replace(/-/g, "/"));
		const parsedDate = parseTime(startTimeStr, localDate);

		if (!parsedDate) {
			alert("Could not determine the booking time. Please try again.");
			return;
		}

		const dateTime = parsedDate.toISOString();

		const validated = JSON.parse(
			sessionStorage.getItem("validatedAddress") || "{}"
		);

		const bookingPayload = {
			firstName: form.first,
			lastName: form.last,
			phone: form.phone,
			email: form.email,
			serviceType: form.service,
			date: dateTime,
			slot,
			companyId,
			address: validated.address || null,
			location: {
				lat: validated.lat || null,
				lng: validated.lng || null,
			},
		};

		try {
			const res = await fetch("/api/booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingPayload),
			});

			const data = await res.json();
			if (!res.ok || !data.booking)
				throw new Error(data.error || "Failed to create booking");

			sessionStorage.setItem("bookingDetails", JSON.stringify(data.booking));
			router.push(`/booking/payment?companyId=${companyId}`);
		} catch (err: any) {
			alert(err.message || "Something went wrong while creating the booking.");
		}
	}

	if (loading)
		return (
			<div className="flex items-center justify-center py-12 text-gray-500">
				<Loader2 className="w-5 h-5 animate-spin mr-2" />
				Loading services...
			</div>
		);

	if (error)
		return (
			<div className="text-center py-12 text-red-500 font-medium">
				Failed to load services: {error}
			</div>
		);

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-2xl mx-auto mt-12 px-6 py-8 bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl"
		>
			<Stepper step={3} />

			<div className="text-center mb-6">
				<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">
					Your Details
				</h2>

				<p className="text-gray-500 text-sm mt-2">
					Scheduled for{" "}
					<span className="font-semibold text-gray-800">
						<LocalTimeDisplay day={day} slot={slot} />
					</span>
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
				<input
					name="first"
					placeholder="First Name"
					onChange={handleChange}
					required
					className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					name="last"
					placeholder="Last Name"
					onChange={handleChange}
					required
					className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<input
				name="phone"
				placeholder="Phone"
				onChange={handleChange}
				required
				className="w-full mb-3 border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<input
				name="email"
				type="email"
				placeholder="Email"
				onChange={handleChange}
				required
				className="w-full mb-4 border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			<div className="mb-6">
				<label className="block text-sm font-medium text-gray-600 mb-2">
					Select a Service
				</label>

				{services.length === 0 ? (
					<p className="text-gray-400 italic">No services available.</p>
				) : (
					<motion.select
						name="service"
						required
						onChange={handleChange}
						className="w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						whileFocus={{ scale: 1.01 }}
					>
						<option value="">Choose a service</option>
						{services.map((s) => (
							<option key={s.id} value={s.name}>
								{s.name} — ${(s.priceCents / 100).toFixed(2)} ( {s.durationText}{" "}
								)
							</option>
						))}
					</motion.select>
				)}
			</div>

			<motion.button
				type="submit"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.97 }}
				className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-3 rounded-xl shadow hover:shadow-md transition"
			>
				<Briefcase className="h-5 w-5" />
				Continue to Payment
			</motion.button>
		</form>
	);
}
