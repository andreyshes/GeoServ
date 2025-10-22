"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			let data: any;
			try {
				data = await res.json();
			} catch {
				console.error("Unexpected non-JSON response:", await res.text());
				alert("Server error — please try again.");
				setLoading(false);
				return;
			}

			if (!res.ok || !data.success) {
				alert(data.error || "Invalid email or password");
				setLoading(false);
				return;
			}

			await new Promise<void>((resolve) => {
				sessionStorage.setItem("companyId", data.user.companyId);
				sessionStorage.setItem("userEmail", data.user.email);
				sessionStorage.setItem("userRole", data.user.role);
				requestAnimationFrame(() => resolve());
			});
			console.log("✅ Stored company info:", {
				companyId: data.user.companyId,
				email: data.user.email,
				role: data.user.role,
			});

			await new Promise((resolve) => setTimeout(resolve, 150));

			router.push("/dashboard");
		} catch (err) {
			console.error("❌ Login failed:", err);
			alert("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
			{/* Glow blobs */}
			<div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-neutral-700/20 blur-[150px] rounded-full" />
			<div className="absolute bottom-[-20rem] right-[-10rem] w-[600px] h-[600px] bg-neutral-600/10 blur-[160px] rounded-full" />

			{/* Card */}
			<div className="relative z-10 w-[90%] max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgb(0_0_0_/_0.4)] p-10">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-semibold tracking-tight text-white">
						Welcome Back
					</h1>
					<p className="text-neutral-400 mt-2">
						Login to your company portal to continue.
					</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-6">
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
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 hover:from-neutral-700 hover:to-neutral-600 transition-all duration-300 py-3 rounded-xl font-medium text-white shadow-[0_4px_24px_rgb(0_0_0_/_0.25)] hover:shadow-[0_6px_32px_rgb(0_0_0_/_0.35)]"
					>
						{loading ? "Signing in..." : "Login"}
					</button>
				</form>

				<div className="mt-8 text-center text-sm text-neutral-400">
					<p>
						No account?{" "}
						<Link
							href="/auth/register"
							className="text-white hover:text-neutral-200 font-medium underline underline-offset-4"
						>
							Register
						</Link>
					</p>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
		</div>
	);
}
