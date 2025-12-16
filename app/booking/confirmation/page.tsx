"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ExternalLink, Home } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
// Using base HTML elements for the card structure to ensure full control over dark theme
import { useCompanyId } from "../CompanyProvider";

interface ConfirmationPageProps {
	companyId?: string;
	embedded?: boolean;
}

// Custom Component for a Detail Row (Premium Look)
const DetailRow = ({
	label,
	value,
	className = "",
}: {
	label: string;
	value: React.ReactNode;
	className?: string;
}) => (
	<div
		className={`flex justify-between border-b border-neutral-700 py-3 ${className}`}
	>
		<span className="text-neutral-400 font-medium">{label}</span>
		<span className="text-white font-semibold">{value}</span>
	</div>
);

export default function ConfirmationPage({
	companyId,
	embedded = false,
}: ConfirmationPageProps = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const contextCompanyId = useCompanyId();

	const effectiveCompanyId = companyId || contextCompanyId;

	const bookingId = searchParams.get("bookingId");
	const paidParam = searchParams.get("paid") === "true";

	const [booking, setBooking] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	// --- LOGIC (Kept as is) ---
	useEffect(() => {
		async function fetchBooking() {
			if (!bookingId) {
				console.warn("⚠️ No bookingId found in URL");
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`/api/booking/${bookingId}`);
				const data = await res.json();

				if (!data.success) {
					throw new Error(data.error || "Failed to load booking");
				}

				setBooking(data.data.booking);
			} catch (err) {
				console.error("❌ Failed to fetch booking:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchBooking();
	}, [bookingId]);

	const homeUrl =
		embedded && effectiveCompanyId ? `/embed/${effectiveCompanyId}` : "/";

	// --- LOADING STATE (Premium Look) ---
	if (loading) {
		return (
			<div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center py-24 text-white/70">
				<Loader2 className="animate-spin w-8 h-8 mb-4 text-blue-500" />
				<p className="text-lg">Finalizing your secure booking details...</p>
			</div>
		);
	}

	// --- NOT FOUND STATE (Premium Look) ---
	if (!booking) {
		return (
			<div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center py-24 text-white">
				<p className="text-xl mb-6">
					Booking record not found or inaccessible.
				</p>
				<button
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
					onClick={() => router.push(homeUrl)}
				>
					<Home className="w-5 h-5" />
					Back to GeoServ Home
				</button>
			</div>
		);
	}

	// --- CONFIRMED STATE (Premium Look) ---
	const isPaid = booking.paid || paidParam;

	return (
		<section className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center py-20 px-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
				className="relative z-10 w-full max-w-xl mx-auto"
			>
				<div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl shadow-blue-900/40 p-8 sm:p-10">
					{/* Confirmation Header */}
					<div className="text-center mb-8">
						<CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
						<h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
							Booking Secured!
						</h1>

						<p className="text-neutral-400 mb-6 text-center text-lg">
							Your service is confirmed with{" "}
							<strong className="text-blue-400">
								{booking.company?.name || "our trusted partner"}
							</strong>
							.
						</p>

						<p className="text-sm text-neutral-500 max-w-md mx-auto">
							A detailed receipt and confirmation link has been delivered to{" "}
							<strong className="text-white">
								{booking.customer?.email || "your inbox"}
							</strong>
							.
						</p>
					</div>

					{/* Booking Details Card (High Contrast) */}
					<div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
						<h2 className="text-xl font-bold text-white mb-4 border-b border-neutral-700 pb-3">
							Appointment Summary
						</h2>

						{/* Detail Rows */}
						<DetailRow
							label="Booking ID"
							value={
								<code className="bg-neutral-900 px-2 py-1 rounded text-sm">
									{bookingId || "N/A"}
								</code>
							}
						/>
						<DetailRow label="Service Type" value={booking.serviceType} />
						<DetailRow
							label="Date"
							value={new Date(booking.date).toLocaleDateString(undefined, {
								dateStyle: "medium",
							})}
						/>
						<DetailRow label="Time Slot" value={booking.slot} />

						<DetailRow
							label="Payment Status"
							value={
								<span
									className={`font-bold ${isPaid ? "text-green-400" : "text-orange-400"}`}
								>
									{isPaid ? "Payment Received" : "Pending Action"}
								</span>
							}
							className="border-b-0"
						/>
					</div>

					{/* Action Buttons */}
					<div className="mt-8 flex flex-col sm:flex-row gap-4">
						{isPaid && booking.paymentReceiptUrl && (
							<a
								href={booking.paymentReceiptUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:bg-green-500 transition-all duration-200"
							>
								<ExternalLink className="w-5 h-5" />
								View/Print Receipt
							</a>
						)}

						<button
							className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
								isPaid && booking.paymentReceiptUrl
									? "bg-neutral-700 text-white hover:bg-neutral-600"
									: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30"
							}`}
							onClick={() => router.push(homeUrl)}
						>
							<Home className="w-5 h-5" />
							{isPaid && booking.paymentReceiptUrl ? "Close" : "Back to Home"}
						</button>
					</div>
				</div>
			</motion.div>
		</section>
	);
}
