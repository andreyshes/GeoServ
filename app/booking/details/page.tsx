"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import { motion } from "framer-motion";
import {
	Briefcase,
	Loader2,
	User,
	Phone,
	Mail,
	Clock,
	MapPin,
} from "lucide-react";
import { useCompanyId } from "../CompanyProvider";
import { LocalTimeDisplay } from "@/app/components/LocalTime";

// --- Type Definitions (Kept as provided) ---
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

interface DetailsPageProps {
	companyId?: string;
	embedded?: boolean;
}

// --- Component Start ---

// Reusable Input Component for premium look
const DarkInput = ({
	icon: Icon,
	...props
}: {
	icon: React.ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
	<div className="relative">
		<Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
		<input
			{...props}
			className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-base"
		/>
	</div>
);

export default function DetailsPage({
	companyId,
	embedded = false,
}: DetailsPageProps = {}) {
	// --- STATE & ROUTER (Logic Kept as is) ---
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
	const [validatedAddress, setValidatedAddress] = useState<{
		address: string;
		lat: number;
		lng: number;
	} | null>(null);

	const router = useRouter();
	const params = useSearchParams();
	const contextCompanyId = useCompanyId();
	const effectiveCompanyId = companyId || contextCompanyId;

	const day = params.get("day");
	const slot = params.get("slot");

	// --- useEffect for Address Validation (Logic Kept as is) ---
	useEffect(() => {
		const saved = sessionStorage.getItem("validatedAddress");
		if (!saved) {
			alert("Please enter your address before continuing.");
			router.push("/booking/address");
			return;
		}

		try {
			setValidatedAddress(JSON.parse(saved));
		} catch (err) {
			console.error("❌ Failed to parse validatedAddress:", err);
			router.push("/booking/address");
		}
	}, [router]);

	// --- useEffect for Service Fetching (Logic Kept as is) ---
	useEffect(() => {
		if (!effectiveCompanyId) return;
		let isMounted = true;

		async function fetchServices() {
			try {
				const res = await fetch(`/api/company/${effectiveCompanyId}/services`);
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
	}, [effectiveCompanyId]);

	// --- Handlers and Submit (Logic Kept as is) ---
	function handleChange(
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}

	// NOTE: The parseTime function is complex and essential for the logic,
	// so it's kept exactly as is.
	function parseTime(timeStr: string, baseDate: Date): Date | null {
		const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
		if (!match) return null;

		let [, h, m, period] = match;
		let hour = parseInt(h, 10);
		const minute = m ? parseInt(m, 10) : 0;

		if (!period) period = "AM";
		if (/pm/i.test(period) && hour < 12) hour += 12;
		if (/am/i.test(period) && hour === 12) hour = 0;

		return new Date(
			baseDate.getFullYear(),
			baseDate.getMonth(),
			baseDate.getDate(),
			hour,
			minute,
			0,
			0
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!effectiveCompanyId || !day || !slot) {
			alert("Missing booking details — cannot complete booking.");
			return;
		}

		if (!validatedAddress) {
			alert("Please enter a valid address before booking.");
			router.push("/booking/address");
			return;
		}

		const [startTimeRaw] = slot.split("–") || ["00:00"];
		const startTimeStr = startTimeRaw.trim();
		const localDate = new Date(day!.replace(/-/g, "/"));
		const parsedDate = parseTime(startTimeStr, localDate);
		if (!parsedDate) {
			alert("Could not determine the booking time. Please try again.");
			return;
		}

		const dateTime = parsedDate.toISOString();

		const bookingPayload = {
			firstName: form.first,
			lastName: form.last,
			phone: form.phone,
			email: form.email,
			serviceType: form.service,
			date: dateTime,
			slot,
			companyId: effectiveCompanyId,
			address: validatedAddress.address ?? "",
			location: {
				lat: validatedAddress.lat ?? null,
				lng: validatedAddress.lng ?? null,
			},
			paymentMethod: "stripe",
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

			sessionStorage.removeItem("validatedAddress");
			sessionStorage.removeItem("companyId");
			sessionStorage.setItem("bookingDetails", JSON.stringify(data.booking));

			if (embedded) {
				const target = effectiveCompanyId
					? `/embed/${effectiveCompanyId}?step=payment`
					: `?step=payment`;
				router.push(target);
			} else {
				router.push(`/booking/payment?companyId=${effectiveCompanyId}`);
			}
		} catch (err: any) {
			alert(err.message || "Something went wrong while creating the booking.");
		}
	}

	// --- LOADING/ERROR STATES (Updated UI) ---
	if (loading)
		return (
			<div className="min-h-[400px] flex items-center justify-center text-white/70 bg-neutral-950">
				<Loader2 className="w-6 h-6 animate-spin mr-3 text-blue-500" />
				<span className="text-lg">Loading services and data structure...</span>
			</div>
		);

	if (error)
		return (
			<div className="text-center py-12 text-red-400 bg-neutral-900 border border-red-900/50 rounded-xl max-w-lg mx-auto mt-12">
				<p className="font-medium text-lg">System Error</p>
				<p className="text-sm">Failed to load services: {error}</p>
			</div>
		);

	// --- RENDER FORM (Premium Dark UI) ---
	return (
		<div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 flex flex-col items-center pt-16">
			{/* Background gradient for depth */}
			<div className="absolute inset-0 z-0 opacity-15 bg-[radial-gradient(45%_35%_at_50%_40%,var(--tw-color-blue-900)_0%,transparent_100%)]" />

			<motion.form
				onSubmit={handleSubmit}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="relative z-10 w-full max-w-2xl mx-auto bg-neutral-900 border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8"
			>
				<BookingProgress currentStep="details" />

				{/* Header and Summary Panel */}
				<div className="mb-8 border-b border-neutral-700 pb-6">
					<h2 className="text-3xl font-bold tracking-tight text-white mb-2">
						Confirm Your Contact Information
					</h2>
					<p className="text-neutral-400 text-lg">
						Final step before securing your professional.
					</p>

					{/* Summary Box (Key Information) */}
					<div className="mt-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-sm font-medium">
						<div className="flex justify-between items-center text-blue-400 mb-1">
							<span className="flex items-center gap-2">
								<Clock className="h-4 w-4" /> SERVICE TIME:
							</span>
							<span className="text-white font-semibold">
								<LocalTimeDisplay day={day} slot={slot} />
							</span>
						</div>
						<div className="flex justify-between items-start text-neutral-500">
							<span className="flex items-center gap-2 pt-1">
								<MapPin className="h-4 w-4" /> LOCATION:
							</span>
							<span className="text-white text-right max-w-[60%] pt-1">
								{validatedAddress?.address || "Address loading..."}
							</span>
						</div>
					</div>
				</div>

				{/* Contact Details Section */}
				<h3 className="text-xl font-semibold text-neutral-300 mb-4">
					Your Contact Information
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
					<DarkInput
						name="first"
						placeholder="First Name"
						onChange={handleChange}
						required
						icon={User}
					/>
					<DarkInput
						name="last"
						placeholder="Last Name"
						onChange={handleChange}
						required
						icon={User}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
					<DarkInput
						name="phone"
						placeholder="Phone Number"
						onChange={handleChange}
						required
						icon={Phone}
						type="tel"
					/>
					<DarkInput
						name="email"
						placeholder="Email Address"
						onChange={handleChange}
						required
						icon={Mail}
						type="email"
					/>
				</div>

				{/* Service Selection Section */}
				<h3 className="text-xl font-semibold text-neutral-300 mb-4 pt-4 border-t border-neutral-800">
					Service Selection
				</h3>

				<div className="mb-8">
					{services.length === 0 ? (
						<p className="text-neutral-500 italic p-4 bg-neutral-800 rounded-lg">
							No services configured for this provider.
						</p>
					) : (
						<div className="relative">
							<Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
							<motion.select
								name="service"
								required
								onChange={handleChange}
								className="w-full bg-neutral-800 border border-neutral-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-base appearance-none"
								whileFocus={{ scale: 1.01 }}
							>
								<option value="" disabled className="text-neutral-500">
									--- Choose a service ---
								</option>
								{services.map((s) => (
									<option
										key={s.id}
										value={s.name}
										className="bg-neutral-800 text-white"
									>
										{s.name} — ${(s.priceCents / 100).toFixed(2)} (
										{s.durationText})
									</option>
								))}
							</motion.select>
							<svg
								className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					)}
				</div>

				{/* Submit Button */}
				<motion.button
					type="submit"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					disabled={!form.service}
					className={`w-full flex items-center justify-center gap-3 font-semibold py-4 rounded-xl shadow-lg transition-all text-lg
                    ${
											!form.service
												? "bg-neutral-600 text-neutral-400 cursor-not-allowed shadow-neutral-700/30"
												: "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/30"
										}
                `}
				>
					<Briefcase className="h-5 w-5" />
					Proceed to Payment
				</motion.button>
			</motion.form>
		</div>
	);
}
