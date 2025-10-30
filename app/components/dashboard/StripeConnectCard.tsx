"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface StripeConnectCardProps {
	companyId: string;
}

export default function StripeConnectCard({
	companyId,
}: StripeConnectCardProps) {
	const [connected, setConnected] = useState<boolean | null>(null);
	const [loadingConnect, setLoadingConnect] = useState(false);

	useEffect(() => {
		async function checkStripeStatus() {
			try {
				const res = await fetch("/api/stripe/check-status", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ companyId }),
				});
				const data = await res.json();
				setConnected(data.connected);
			} catch (err) {
				console.error("❌ Error checking Stripe status:", err);
				setConnected(false);
			}
		}
		checkStripeStatus();
	}, [companyId]);

	async function handleConnect() {
		try {
			setLoadingConnect(true);
			const res = await fetch("/api/stripe/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyId }),
			});
			const data = await res.json();
			if (data.url) window.location.href = data.url;
			else alert(data.error || "Error connecting Stripe");
		} catch (err) {
			console.error("❌ Connect error:", err);
			alert("Something went wrong, please try again.");
		} finally {
			setLoadingConnect(false);
		}
	}

	return (
		<div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between">
			<div>
				<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
					<DollarSign className="w-5 h-5 text-blue-500" />
					Stripe Payments
				</h2>
				<p className="text-sm text-gray-500 mt-1">
					Connect your Stripe account to receive customer payments directly.
				</p>
			</div>

			{connected === null ? (
				<p className="text-gray-400 mt-3 sm:mt-0">Checking...</p>
			) : connected ? (
				<div className="flex items-center gap-2 text-green-600 font-medium mt-3 sm:mt-0">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-5 h-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Stripe Connected
				</div>
			) : (
				<Button
					onClick={handleConnect}
					disabled={loadingConnect}
					className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
				>
					{loadingConnect ? "Connecting..." : "Connect with Stripe"}
				</Button>
			)}
		</div>
	);
}
