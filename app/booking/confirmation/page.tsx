"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Card,
	CardHeader,
	CardContent,
	CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useCompanyId } from "../CompanyProvider";

export default function ConfirmationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const companyId = useCompanyId();

	const sessionId = searchParams.get("session_id");
	const bookingIdParam = searchParams.get("bookingId");
	const paidParam = searchParams.get("paid") === "true";

	const [bookingId, setBookingId] = useState<string | null>(bookingIdParam);
	const [booking, setBooking] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function resolveBooking() {
			if (bookingIdParam) return;
			if (!sessionId) return;

			try {
				const res = await fetch(`/api/booking/by-session/${sessionId}`);
				if (!res.ok) throw new Error("Failed to resolve booking from session.");
				const data = await res.json();
				if (data?.id) setBookingId(data.id);
			} catch (err) {
				console.error("❌ Failed to resolve booking:", err);
			}
		}
		resolveBooking();
	}, [sessionId, bookingIdParam]);

	useEffect(() => {
		async function fetchBooking() {
			if (!bookingId) return;
			try {
				const res = await fetch(`/api/booking/${bookingId}`);
				const data = await res.json();
				setBooking(data);
			} catch (err) {
				console.error("Failed to fetch booking:", err);
			} finally {
				setLoading(false);
			}
		}
		fetchBooking();
	}, [bookingId]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-gray-600">
				<Loader2 className="animate-spin w-8 h-8 mb-4" />
				<p>Loading your booking details...</p>
			</div>
		);
	}

	if (!booking) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-gray-600">
				<p>Booking not found.</p>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => router.push("/")}
				>
					Back to Home
				</Button>
			</div>
		);
	}

	return (
		<section className="flex flex-col items-center justify-center py-20 px-4">
			<CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
			<h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>

			<p className="text-gray-600 mb-8 text-center max-w-md">
				Thanks for booking with{" "}
				<strong>{booking.company?.name || "our partner company"}</strong>. We’ve
				sent a confirmation email to{" "}
				<strong>{booking.customer?.email || "your inbox"}</strong>.
			</p>

			<Card className="w-full max-w-lg shadow-lg border border-border bg-white/90 backdrop-blur-md">
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-gray-800">
						Booking Details
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-gray-700">
					<p>
						<strong>Service:</strong> {booking.serviceType}
					</p>
					<p>
						<strong>Date:</strong>{" "}
						{new Date(booking.date).toLocaleString(undefined, {
							dateStyle: "medium",
							timeStyle: "short",
							timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						})}
					</p>
					<p>
						<strong>Time Slot:</strong> {booking.slot}
					</p>
					<p>
						<strong>Status:</strong>
						<span
							className={`ml-2 font-medium ${
								booking.paid || paidParam ? "text-green-600" : "text-orange-500"
							}`}
						>
							{booking.paid || paidParam ? "Paid" : "Pending Payment"}
						</span>
					</p>
					{booking.paymentReceiptUrl && (
						<div className="pt-6">
							<a
								href={booking.paymentReceiptUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
							>
								View Payment Receipt
								<ExternalLink className="w-4 h-4 opacity-80" />
							</a>
						</div>
					)}
				</CardContent>
			</Card>

			<Button
				variant="outline"
				className="mt-10"
				onClick={() => {
					const url = companyId ? `/?companyId=${companyId}` : "/";
					router.push(url);
				}}
			>
				Back to Home
			</Button>
		</section>
	);
}
