"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useCompanyId } from "../CompanyProvider";
import { MapPin, Search, Mail, Clock, CheckCircle } from "lucide-react";

interface AddressPageProps {
	companyId?: string;
	embedded?: boolean;
}

export default function AddressPage({
	companyId,
	embedded = false,
}: AddressPageProps = {}) {
	// --- (All state and logic remains the same) ---
	const [address, setAddress] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [error, setError] = useState<string | undefined>(undefined);
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [notifyLoading, setNotifyLoading] = useState(false);
	const [notifyError, setNotifyError] = useState<string | null>(null);

	const router = useRouter();
	const contextCompanyId = useCompanyId();
	const effectiveCompanyId = companyId || contextCompanyId;
	const embedPath =
		embedded && effectiveCompanyId ? `/embed/${effectiveCompanyId}` : null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(undefined);
		// ... (rest of handleSubmit logic)
		try {
			if (effectiveCompanyId) {
				sessionStorage.setItem(
					"validatedAddress",
					JSON.stringify({ address, lat: null, lng: null })
				);
				sessionStorage.setItem("companyId", effectiveCompanyId);

				if (embedded && embedPath) {
					const query = new URLSearchParams({ step: "schedule", address });
					router.push(`${embedPath}?${query.toString()}`);
				} else {
					const query = new URLSearchParams({
						companyId: effectiveCompanyId,
						address,
					});
					router.push(`/booking/availability?${query.toString()}`);
				}
				return;
			}

			const res = await fetch("/api/validate-address", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ address }),
			});

			const data = await res.json();

			if (data.valid && data.company) {
				sessionStorage.setItem("companyId", data.company.id);
				sessionStorage.setItem(
					"validatedAddress",
					JSON.stringify({
						address,
						lat: data.location.lat,
						lng: data.location.lng,
					})
				);

				if (embedded) {
					const query = new URLSearchParams({
						step: "schedule",
						address,
					});
					router.push(`/embed/${data.company.id}?${query.toString()}`);
				} else {
					const query = new URLSearchParams({
						companyId: data.company.id,
						address,
					});
					router.push(`/booking/availability?${query.toString()}`);
				}
			} else {
				setError(
					data.reason || "Sorry, we currently don't service that area yet."
				);
			}
		} catch (err) {
			console.error("❌ Address validation error:", err);
			setError("Something went wrong. Please try again.");
		}
	}
	async function handleInput(value: string) {
		setAddress(value);

		if (value.length < 3) {
			setSuggestions([]);
			return;
		}

		try {
			const res = await fetch(
				`/api/autocomplete?input=${encodeURIComponent(value)}`
			);
			const data = await res.json();

			if (data.success) {
				setSuggestions(data.data.map((p: any) => p.description));
			} else {
				setSuggestions([]);
			}
		} catch (err) {
			console.error("❌ Autocomplete error:", err);
			setSuggestions([]);
		}
	}

	async function handleNotify(e: React.FormEvent) {
		e.preventDefault();
		setNotifyLoading(true);
		setNotifyError(null);

		try {
			const res = await fetch("/api/notify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, address }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to send email");

			setSubmitted(true);
		} catch (err) {
			console.error("❌ Notification error:", err);
			setNotifyError("Something went wrong. Please try again later.");
		} finally {
			setNotifyLoading(false);
		}
	}

	// --- UI START ---

	return (
		<div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white">
			{/* Full-page ambient gradient (very subtle) */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-neutral-900/60 via-neutral-950 to-neutral-950" />

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.45, ease: "easeOut" }}
				className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4"
			>
				{/* Keep progress visually connected to page */}
				<div className="mb-6 w-full max-w-xl">
					<BookingProgress currentStep="address" />
				</div>

				{/* Main surface */}
				<Card className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
					<CardHeader className="mb-8 p-0 text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10">
							<MapPin className="h-6 w-6 text-blue-400" />
						</div>

						<CardTitle className="text-3xl font-semibold tracking-tight">
							Service area check
						</CardTitle>

						<CardDescription className="mt-2 text-sm text-neutral-400">
							Enter your address to see if GeoServ professionals are available
							near you.
						</CardDescription>
					</CardHeader>

					<CardContent className="p-0">
						{!error && (
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Address input + autocomplete */}
								<div className="relative overflow-visible">
									<Input
										value={address}
										onChange={(e) => handleInput(e.target.value)}
										placeholder="Street address, city"
										className="h-12 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-11"
										required
									/>
									<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />

									{suggestions.length > 0 && (
										<ul className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl max-h-56 overflow-y-auto">
											{suggestions.map((s, i) => (
												<li
													key={i}
													onClick={() => {
														setAddress(s);
														requestAnimationFrame(() => setSuggestions([]));
													}}
													className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm hover:bg-neutral-700"
												>
													<MapPin className="h-4 w-4 text-blue-400 shrink-0" />
													<span className="truncate">{s}</span>
												</li>
											))}
										</ul>
									)}
								</div>

								<Button
									type="submit"
									size="lg"
									disabled={!address.trim()}
									className="h-12 w-full bg-blue-600 font-medium hover:bg-blue-500 transition-colors"
								>
									{effectiveCompanyId
										? "Continue to schedule"
										: "Check availability"}
								</Button>
							</form>
						)}

						{/* Out of service */}
						{error && !submitted && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.25 }}
								className="space-y-5 rounded-xl border border-red-900/40 bg-red-950/30 p-5"
							>
								<p className="text-sm font-medium text-red-400">
									Out of service area
								</p>
								<p className="text-sm text-neutral-300">{error}</p>

								<form onSubmit={handleNotify} className="space-y-4">
									<div className="relative">
										<Input
											type="email"
											placeholder="Email for updates"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="h-11 bg-neutral-800 border-neutral-700 text-white pl-11"
											required
										/>
										<Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
									</div>

									<Button
										type="submit"
										disabled={notifyLoading || !email.trim()}
										variant="secondary"
										className="w-full h-11"
									>
										{notifyLoading ? "Sending…" : "Notify me"}
									</Button>

									{notifyError && (
										<p className="text-sm text-red-400">{notifyError}</p>
									)}
								</form>
							</motion.div>
						)}

						{/* Success */}
						{submitted && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.3 }}
								className="text-center space-y-4"
							>
								<CheckCircle className="mx-auto h-8 w-8 text-green-400" />
								<p className="text-sm text-neutral-300">
									We’ll notify you as soon as GeoServ launches in your area.
								</p>
							</motion.div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
