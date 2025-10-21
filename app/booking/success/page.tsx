"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function BookingSuccessPage() {
	const [booking, setBooking] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const params = useSearchParams();
	const router = useRouter();

	const sessionId = params.get("session_id");

	useEffect(() => {
		if (!sessionId) return;

		async function fetchBooking() {
			try {
				const res = await fetch(`/api/stripe-session?session_id=${sessionId}`);
				const data = await res.json();
				setBooking(data.booking || null);
			} catch (err) {
				console.error("Error fetching booking:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchBooking();
	}, [sessionId]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<p className="text-gray-500 text-lg">Loading your booking...</p>
			</div>
		);
	}

	if (!booking) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<p className="text-red-500 text-lg">Booking not found.</p>
				<button
					className="mt-4 text-blue-600 underline"
					onClick={() => router.push("/")}
				>
					Back to Home
				</button>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto mt-16 text-center">
			<CheckCircle className="mx-auto text-green-500 w-16 h-16 mb-4" />
			<h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
			<p className="text-gray-600 mb-6">
				Your booking for <strong>{booking.serviceType}</strong> on{" "}
				<strong>{new Date(booking.date).toDateString()}</strong> at{" "}
				<strong>{booking.slot}</strong> is confirmed.
			</p>
			<button
				onClick={() => router.push("/")}
				className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
			>
				Back to Home
			</button>
		</div>
	);
}
