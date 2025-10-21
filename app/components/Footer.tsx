import { Lock, Shield } from "lucide-react";

export default function Footer() {
	return (
		<footer className="border-t border-neutral-200 bg-white text-neutral-500">
			<div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-8 gap-4 text-sm">
				{/* Left: Business brand or neutral fallback */}
				<p className="font-medium text-neutral-700">
					{/* This could be dynamic if you inject the business name */}
					Powered by{" "}
					<span className="text-neutral-900 font-semibold">GeoServ</span>
				</p>

				{/* Center: Subtle trust indicators */}
				<div className="flex items-center gap-6 text-neutral-600">
					<div className="flex items-center gap-2">
						<Lock className="h-4 w-4 text-green-600" />
						<span>Secure checkout</span>
					</div>
					<div className="hidden sm:flex items-center gap-2">
						<Shield className="h-4 w-4 text-blue-600" />
						<span>Encrypted data</span>
					</div>
				</div>

				{/* Right: Legal / copyright */}
				<p className="text-xs text-neutral-400">
					© {new Date().getFullYear()} GeoServ. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
