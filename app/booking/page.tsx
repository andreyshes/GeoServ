"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BookingProgress from "@/app/components/BookingProgress";
import { MapPin, ArrowRight } from "lucide-react";

export default function BookingPage() {
	return (
		<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="w-full max-w-md"
			>
				{/* Progress */}
				<BookingProgress currentStep="address" />

				{/* Card */}
				<div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-xl">
					{/* Icon */}
					<div className="mb-5 flex justify-center">
						<div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
							<MapPin className="h-5 w-5 text-blue-500" />
						</div>
					</div>

					{/* Copy */}
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
						Check service availability
					</h1>

					<p className="mt-2 text-sm sm:text-base text-neutral-400 text-center">
						Enter your address to see if GeoServ professionals are available in
						your area.
					</p>

					{/* CTA */}
					<Link
						href="/booking/address"
						className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium hover:bg-blue-500 transition-colors"
					>
						Continue
						<ArrowRight className="h-4 w-4" />
					</Link>

					{/* Trust microcopy */}
					<p className="mt-4 text-xs text-neutral-500 text-center">
						Takes less than a minute · No commitment required
					</p>
				</div>
			</motion.div>
		</div>
	);
}
