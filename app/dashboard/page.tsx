"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardClient from "@/app/dashboard/DashboardClient";

export default function DashboardPage() {
	const [loading, setLoading] = useState(true);
	const [companyId, setCompanyId] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		async function checkAuth() {
			try {
				const {
					data: { user },
					error,
				} = await supabase.auth.getUser();

				if (error || !user) {
					router.replace("/auth/login");
					return;
				}

				if (!["company", "ADMIN"].includes(user.user_metadata.role)) {
					alert(
						"Unauthorized: Only company accounts can access the dashboard."
					);
					router.replace("/auth/login");
					return;
				}

				setCompanyId(user.user_metadata.companyId);
			} catch (err) {
				console.error("Error loading user session in dashboard:", err);
				router.replace("/auth/login");
			} finally {
				setLoading(false);
			}
		}

		checkAuth();
	}, [router]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen text-gray-400">
				Loading dashboard...
			</div>
		);
	}

	if (!companyId) return null;

	return <DashboardClient companyId={companyId} />;
}
