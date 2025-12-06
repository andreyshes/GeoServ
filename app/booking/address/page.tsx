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

interface AddressPageProps {
	companyId?: string;
	embedded?: boolean;
}

export default function AddressPage({
	companyId,
	embedded = false,
}: AddressPageProps= {}) {
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

	// ✅ Autocomplete suggestions
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

			if (data.status === "OK") {
				setSuggestions(data.predictions.map((p: any) => p.description));
			} else {
				setSuggestions([]);
			}
		} catch (err) {
			console.error("❌ Autocomplete error:", err);
		}
	}

	// ✅ Notify user when out of service area
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

	return (
		<div className="container max-w-xl mx-auto mt-12">
			<BookingProgress currentStep="address" />

			<Card className="shadow-xl border border-border bg-white/90 backdrop-blur">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold">
						Enter Your Address
					</CardTitle>
					<CardDescription>
						We’ll check if your location is inside our service area.
					</CardDescription>
				</CardHeader>

				<CardContent>
					{!error && (
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="relative">
								<Input
									value={address}
									onChange={(e) => handleInput(e.target.value)}
									placeholder="123 Main St, City"
									className="pr-3"
									required
								/>
								{suggestions.length > 0 && (
									<ul className="absolute z-10 mt-2 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
										{suggestions.map((s, i) => (
											<li
												key={i}
												onClick={() => {
													setAddress(s);
													setSuggestions([]);
												}}
												className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
											>
												{s}
											</li>
										))}
									</ul>
								)}
							</div>

							<Button
								type="submit"
								size="lg"
								className="w-full bg-gray-200 hover:bg-blue-500 hover:text-white transition-all"
							>
								{effectiveCompanyId ? "Continue" : "Check Address"}
							</Button>
						</form>
					)}

					{error && !submitted && (
						<div className="space-y-4">
							<p className="text-red-600 font-medium">{error}</p>
							<p className="text-sm text-muted-foreground">
								Leave your email and we’ll notify you when we expand to your
								area.
							</p>

							<form onSubmit={handleNotify} className="space-y-3">
								<Input
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
								<Button
									type="submit"
									disabled={notifyLoading}
									className="w-full hover:bg-blue-500 hover:text-white transition-all"
								>
									{notifyLoading ? "Sending..." : "Notify Me"}
								</Button>

								{notifyError && (
									<p className="text-sm text-red-500">{notifyError}</p>
								)}
							</form>
						</div>
					)}

					{submitted && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4 }}
							className="text-center space-y-4"
						>
							<p className="text-green-600 font-semibold text-lg">
								Thanks! We’ll let you know when we launch in your area.
							</p>
							<p className="text-sm text-muted-foreground">
								You can safely close this window or tab.
							</p>
						</motion.div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
