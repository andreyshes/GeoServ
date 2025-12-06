"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function useRealtimeBookings(
	companyId: string,
	onChange?: () => void
) {
	useEffect(() => {
		if (!companyId) return;
		const supabase = supabaseBrowser();
		const channel = supabase
			.channel("booking-updates")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "Booking" },
				() => {
					toast.info("Booking updated");
					onChange?.();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [companyId]);
}
