"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

export function OnboardingSuccessContent() {
	const searchParams = useSearchParams();
	const companyId = searchParams.get("companyId");
	const [connected, setConnected] = useState<boolean | null>(null);

	useEffect(() => {
		async function verifyConnection() {
			if (!companyId) return;
			try {
				const res = await fetch("/api/stripe/check-status", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ companyId }),
				});
				const data = await res.json();
				setConnected(data.connected ?? false);
			} catch (err) {
				console.error("Error checking Stripe status:", err);
				setConnected(false);
			}
		}
		verifyConnection();
	}, [companyId]);

	const statusBox = connected ? (
		<div className="flex flex-col items-center text-green-600">
			<CheckCircle className="w-12 h-12 mb-3" />
			<h1 className="text-3xl font-semibold mb-3">Stripe Connected 🎉</h1>
			<p className="text-gray-600 mb-6">
				Your account is verified and ready to receive payments.
			</p>
		</div>
	) : connected === false ? (
		<div className="flex flex-col items-center text-amber-600">
			<AlertTriangle className="w-12 h-12 mb-3" />
			<h1 className="text-3xl font-semibold mb-3">Almost Done</h1>
			<p className="text-gray-600 mb-6 max-w-sm">
				Stripe connected successfully, but your verification is still pending.
				Please complete any missing information in your Stripe Dashboard.
			</p>
			<a
				href="https://dashboard.stripe.com/connect/accounts"
				target="_blank"
				className="text-blue-600 hover:underline"
			>
				Open Stripe Dashboard
			</a>
		</div>
	) : (
		<p className="text-gray-400">Checking your account status...</p>
	);

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 text-center px-6">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-10 border border-gray-100"
			>
				{statusBox}

				<Link
					href="/dashboard"
					className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6"
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
export default function OnboardingSuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center text-gray-500">
					Loading...
				</div>
			}
		>
			<OnboardingSuccessContent />
		</Suspense>
	);
}
