"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
	const [companyName, setCompanyName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [address, setAddress] = useState("");

	const router = useRouter();

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setErrorMessage("");

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ companyName, email, password, address }),
			});

			const data = await res.json();
			setLoading(false);

			if (!res.ok) throw new Error(data.error || "Registration failed");

			toast.success("Account created!", {
				description: "Redirecting you to login...",
			});

			setTimeout(() => router.push("/auth/login"), 1500);
		} catch (err: any) {
			setErrorMessage(err.message || "Something went wrong.");
			setLoading(false);
		}
	}

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white px-6">
			<div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-neutral-700/20 blur-[150px] rounded-full" />
			<div className="absolute bottom-[-20rem] right-[-10rem] w-[600px] h-[600px] bg-neutral-600/10 blur-[160px] rounded-full" />

			<div className="relative z-10 w-[90%] max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgb(0_0_0_/_0.4)] p-10">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-semibold tracking-tight text-white">
						Create Your Company Account
					</h1>
					<p className="text-neutral-400 mt-2">
						Join the GeoServ platform and start managing bookings today.
					</p>
				</div>

				<form onSubmit={handleRegister} className="space-y-6">
					<div>
						<label className="block text-sm text-neutral-300 mb-1">
							Company Name
						</label>
						<input
							type="text"
							required
							className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 focus:border-transparent transition"
							placeholder="e.g. CleanPro Services"
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-sm text-neutral-300 mb-1">Email</label>
						<input
							type="email"
							required
							className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 focus:border-transparent transition"
							placeholder="you@company.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-sm text-neutral-300 mb-1">
							Password
						</label>
						<input
							type="password"
							required
							className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 focus:border-transparent transition"
							placeholder="••••••••"
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-sm text-neutral-300 mb-1">
							Business Address
						</label>
						<input
							type="text"
							placeholder="123 Main St, Seattle, WA"
							className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40 focus:border-transparent transition"
							onChange={(e) => setAddress(e.target.value)}
						/>
					</div>

					{errorMessage && (
						<p className="text-red-400 text-sm text-center">{errorMessage}</p>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:to-neutral-600 transition-all duration-300 py-3 rounded-xl font-medium text-white shadow-[0_4px_24px_rgb(0_0_0_/_0.25)] hover:shadow-[0_6px_32px_rgb(0_0_0_/_0.35)]"
					>
						{loading ? "Creating account..." : "Register"}
					</button>
				</form>

				<div className="mt-8 text-center text-sm text-neutral-400">
					<p>
						Already have an account?{" "}
						<Link
							href="/auth/login"
							className="text-white hover:text-neutral-200 font-medium underline underline-offset-4"
						>
							Log in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
