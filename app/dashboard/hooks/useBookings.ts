"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type Booking = {
	id: string;
	serviceType: string;
	date: string;
	slot: string;
	status: string;
	paid: boolean;
	amountCents: number | null;
	paymentReceiptUrl?: string | null;
	address?: string | null;
	customer: { firstName: string; lastName: string; email: string };
	companyId?: string;
};

export default function useBookings(companyId: string) {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const limit = 10;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);



	const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
	const supabase = supabaseBrowser();

	async function fetchBookings() {
		try {
			setLoading(true);
			const res = await fetch(
				`/api/company/${companyId}/booking?page=${page}&limit=${limit}`
			);
			if (!res.ok) throw new Error("Failed to load bookings");

			const data = await res.json();
			setBookings(data.bookings || []);
			setTotal(data.total || 0);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	/** ⬇ Update booking status (complete/canceled) */
	async function updateBookingStatus(
		id: string,
		status: "completed" | "canceled"
	) {
		try {
			const res = await fetch(`/api/company/${companyId}/booking/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
			});

			if (!res.ok) throw new Error("Failed to update booking");

			toast.success(
				status === "completed"
					? "Booking marked as completed"
					: "Booking canceled"
			);

			// instantly update UI
			setBookings((prev) =>
				prev.map((b) => (b.id === id ? { ...b, status } : b))
			);

			// refresh totals
			fetchBookings();
		} catch (err) {
			toast.error("Failed to update booking");
		}
	}


	useEffect(() => {
		if (!companyId) return;

		const channel = supabase
			.channel("booking-updates")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "Booking" },
				(payload) => {
					const newRecord = payload.new as Booking | null;
					const oldRecord = payload.old as Booking | null;

					// ignore events not belonging to this company
					const recCompany = newRecord?.companyId || oldRecord?.companyId;
					if (recCompany !== companyId) return;

					// debounce to avoid spam
					if (fetchTimeout.current) clearTimeout(fetchTimeout.current);

					fetchTimeout.current = setTimeout(() => {
						handleRealtimeEvent(payload.eventType, newRecord, oldRecord);
					}, 150);
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [companyId]);

	/** ⬇ Handle insert/update/delete events */
	function handleRealtimeEvent(
		eventType: string,
		newRecord: Booking | null,
		oldRecord: Booking | null
	) {
		setBookings((prev) => {
			switch (eventType) {
				case "INSERT":
					if (!newRecord) return prev;
					toast.success("📦 New booking received!");
					return [newRecord, ...prev];

				case "UPDATE":
					if (!newRecord) return prev;
					toast.info("🔄 Booking updated");
					return prev.map((b) => (b.id === newRecord.id ? newRecord : b));

				case "DELETE":
					if (!oldRecord) return prev;
					toast.info("🗑 Booking removed");
					return prev.filter((b) => b.id !== oldRecord.id);

				default:
					return prev;
			}
		});
	}


	useEffect(() => {
		fetchBookings();
	}, [page, companyId]);

	// compute stats
	const totalBookings = bookings.length;
	const totalPaid = bookings.filter((b) => b.paid).length;
	const totalRevenue = bookings.reduce(
		(sum, b) => sum + (b.paid ? (b.amountCents ?? 0) : 0),
		0
	);

	const hasPending = bookings.some((b) => b.status === "pending");

	return {
		bookings,
		page,
		setPage,
		total,
		loading,
		error,
		totalPaid,
		totalBookings,
		totalRevenue,
		hasPending,
		updateBookingStatus,
		refetch: fetchBookings,
	};
}
