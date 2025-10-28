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

			window.location.href = data.url || data.checkoutUrl;
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

			const query = new URLSearchParams({
				paid: "false",
				bookingId: booking.id,
			});

			if (embedded) {
				query.set("step", "confirmation");
				const target = effectiveCompanyId
					? `/embed/${effectiveCompanyId}?${query.toString()}`
					: `?${query.toString()}`;
				router.push(target);
			} else {
				if (effectiveCompanyId) query.append("companyId", effectiveCompanyId);
				router.push(`/booking/confirmation?${query.toString()}`);
			}
		} catch (err: any) {
			alert(err.message || "Something went wrong.");
			console.error("❌ Pay on Arrival error:", err);
			setLoading(false);
		}
	}

	return (
		<div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
			<BookingProgress currentStep="payment" />

			<h2 className="text-3xl font-semibold mb-6 text-center bg-gradient-to-r from-neutral-900 via-gray-700 to-gray-500 dark:from-gray-100 dark:via-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
				Complete Your Booking
			</h2>

			<p className="text-center text-gray-500 mb-8">
				Choose how you'd like to pay for your appointment.
			</p>

			<div className="flex flex-col sm:flex-row gap-4">
				<button
					onClick={handlePayNow}
					disabled={loading}
					className={`flex-1 py-3 rounded-lg text-white font-medium transition-all ${
						loading
							? "bg-blue-400 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md"
					}`}
				>
					{loading ? "Processing..." : "Pay Now"}
					<p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
						<Lock className="w-3 h-3" /> Securely processed by Stripe
					</p>
				</button>

				<button
					onClick={handlePayOnArrival}
					disabled={loading}
					className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all border border-gray-300 disabled:opacity-70"
				>
					Pay on Arrival
				</button>
			</div>

			<p className="text-center text-sm text-gray-400 mt-6">
				Payments are securely processed through Stripe.
			</p>
		</div>
	);
}
