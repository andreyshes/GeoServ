import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
	const supabase = await supabaseServer();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}


	const meta = user.user_metadata || user.app_metadata;


	if (!["ADMIN", "COMPANY"].includes(meta.role)) {
		redirect("/auth/login");
	}


	const companyId = meta.companyId;


	if (!companyId) {
		redirect("/auth/login");
	}

	// Pass companyId to your client component
	return <DashboardClient companyId={companyId} />;
}
