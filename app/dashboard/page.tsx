"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabaseClient";

import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
	const [loading, setLoading] = useState(true);
	const [companyId, setCompanyId] = useState<string | null>(null);

	const routerReplace = (path: string) => {
		window.location.replace(path);
	};

	useEffect(() => {
		async function checkAuth() {
			await new Promise((resolve) => setTimeout(resolve, 300));

			try {
				const {
					data: { user },
					error,
				} = await supabase.auth.getUser();

				if (error || !user) {
					routerReplace("/auth/login");
					return;
				}

				const userMetadata = user.user_metadata || user.app_metadata;

				if (!["ADMIN", "COMPANY"].includes(userMetadata.role)) {
					console.error(
						"Unauthorized: Only company accounts can access the dashboard."
					);
					routerReplace("/auth/login");
					return;
				}

				setCompanyId(userMetadata.companyId);
			} catch (err) {
				console.error("Error loading user session in dashboard:", err);
				routerReplace("/auth/login");
			} finally {
				setLoading(false);
			}
		}

		checkAuth();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-neutral-900 text-gray-400">
				Loading dashboard...
			</div>
		);
	}

	if (!companyId) return null;

	return <DashboardClient companyId={companyId} />;
}
