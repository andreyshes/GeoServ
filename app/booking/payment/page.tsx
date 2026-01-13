"use client";

import { useRouter } from "next/navigation";
import BookingProgress from "@/app/components/BookingProgress";
import { useState } from "react";
import { useCompanyId } from "../CompanyProvider";
import { Lock } from "lucide-react";

interface PaymentPageProps {
	companyId?: string;
	embedded?: boolean;
}

export default function PaymentPage({
	companyId,
	embedded = false,
}: PaymentPageProps = {}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const contextCompanyId = useCompanyId();

	const effectiveCompanyId = companyId || contextCompanyId;

	async function handlePayNow() {
		try {
			setLoading(true);
			const bookingData = sessionStorage.getItem("bookingDetails");
			if (!bookingData) throw new Error("Booking information missing.");

			const booking = JSON.parse(bookingData);
			if (!booking?.id) throw new Error("Invalid booking ID.");

			const res = await fetch("/api/payment", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: booking.id,
					companyId: effectiveCompanyId,
				}),
			});

			const data = await res.json();

			if (!res.ok)
				throw new Error(data.error || "Payment initialization failed");

			const checkoutUrl = data.url || data.checkoutUrl;
			if (!checkoutUrl)
				throw new Error("No checkout URL received from server.");

			if (typeof window !== "undefined") {
				if (window.top && window.top !== window.self) {
					window.top.location.href = checkoutUrl;
				} else {
					window.location.href = checkoutUrl;
				}
			}
		} catch (err: any) {
			console.error("❌ Payment error:", err);
			alert(err.message || "Something went wrong, please try again.");
			setLoading(false);
		}
	}

	async function handlePayOnArrival() {
		try {
			setLoading(true);
			const bookingData = sessionStorage.getItem("bookingDetails");
			if (!bookingData) throw new Error("Booking details missing.");

			const booking = JSON.parse(bookingData);

			const res = await fetch("/api/booking", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId: booking.id }),
			});

			if (!res.ok) {
				throw new Error("Failed to confirm booking");
			}

			const query = new URLSearchParams({
				paid: "false",
				bookingId: booking.id,
			});

			if (effectiveCompanyId) query.append("companyId", effectiveCompanyId);
			router.push(`/booking/confirmation?${query.toString()}`);
		} catch (err) {
			console.error("❌ Pay on Arrival error:", err);
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="w-full max-w-2xl">
				<BookingProgress currentStep="payment" />

				<div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-8">
					{/* Header */}
					<div className="text-center mb-10">
						<h2 className="text-3xl font-semibold tracking-tight text-white">
							Complete your booking
						</h2>
						<p className="mt-2 text-neutral-400">
							Choose how you’d like to pay for your appointment.
						</p>
					</div>

					{/* Payment options */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Pay now */}
						<button
							onClick={handlePayNow}
							disabled={loading}
							className="group rounded-xl border border-blue-500/30 bg-linear-to-b from-blue-600 to-blue-700 px-6 py-5 text-center text-white transition-all hover:from-blue-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-60"
						>
							<span className="block text-lg font-semibold">
								{loading ? "Processing…" : "Pay now"}
							</span>

							<span className="mt-1 flex items-center justify-center gap-1 text-xs text-blue-100 opacity-90">
								<Lock className="h-3 w-3" />
								Secure checkout powered by Stripe
							</span>
						</button>

						{/* Pay later */}
						<button
							onClick={handlePayOnArrival}
							disabled={loading}
							className="rounded-xl border border-white/10 bg-neutral-800 px-6 py-5 text-center text-white transition-all hover:bg-neutral-700 hover:shadow-md hover:shadow-black/30 disabled:opacity-60"
						>
							<span className="block text-lg font-semibold">
								Pay on arrival
							</span>

							<span className="mt-1 block text-xs text-neutral-400">
								Pay directly to the provider after service
							</span>
						</button>
					</div>

					<p className="mt-8 text-center text-xs text-neutral-500">
						Payments are securely processed through Stripe.
					</p>
				</div>
			</div>
		</div>
	);
}
