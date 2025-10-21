"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallback() {
	const router = useRouter();
	const supabase = createClientComponentClient();

	useEffect(() => {
		const handleAuth = async () => {
			// Exchange the code from the URL for a valid session
			const { data, error } = await supabase.auth.exchangeCodeForSession(
				window.location.href
			);

			if (error) {
				console.error("Error exchanging session:", error.message);
				router.push("/auth/login");
				return;
			}

			// Once the session is set, redirect based on role or straight to dashboard
			const user = data?.user;
			const role = user?.user_metadata?.role;

			if (role === "company") {
				router.push("/dashboard");
			} else {
				// if you want, handle customers differently
				router.push("/");
			}
		};

		handleAuth();
	}, [router, supabase]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen text-white bg-gradient-to-br from-[#05071a] via-[#0a0f2c] to-[#0e122e]">
			<p className="text-lg font-medium">Verifying your email...</p>
			<p className="text-gray-400 text-sm mt-2">
				Please wait, you’ll be redirected shortly.
			</p>
		</div>
	);
}
