"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OnboardingSuccessPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 text-center px-6">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-10 border border-gray-100"
			>
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
					className="flex justify-center mb-6"
				>
					<div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-3 shadow-lg">
						<CheckCircle className="w-12 h-12 text-white" />
					</div>
				</motion.div>

				<h1 className="text-3xl font-semibold text-gray-900 mb-3">
					Stripe Connected 🎉
				</h1>

				<p className="text-gray-600 mb-8">
					Your account is now fully verified and ready to receive payments.
					You’re all set to start accepting bookings and grow your business.
				</p>

				<Link
					href="/dashboard"
					className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
				>
					Go to Dashboard
				</Link>
			</motion.div>

			<p className="mt-8 text-sm text-gray-500">
				Need help?{" "}
				<a
					href="mailto:support@geoserv.org"
					className="text-blue-600 hover:underline"
				>
					Contact Support
				</a>
			</p>
		</div>
	);
}
