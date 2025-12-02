"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import useBookings from "./hooks/useBookings";
import useServices from "./hooks/useServices";
import useRealtimeBookings from "./hooks/useRealTimeBookings";

// COMPONENTS
import StripeConnectCard from "@/app/dashboard/components/StripeConnectCard";
import BusinessInfoCard from "@/app/dashboard/components/BusinessInfoCard";
import StatsCards from "@/app/dashboard/components/StatsCards";
import BookingsTable from "@/app/dashboard/components/BookingsTable";
import ServicesSection from "@/app/dashboard/components/ServicesSection";

import { Button } from "@/app/components/ui/button";

interface DashboardClientProps {
	companyId: string;
}

export default function DashboardClient({ companyId }: DashboardClientProps) {
	const {
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
		refetch: refetchBookings,
	} = useBookings(companyId);

	useRealtimeBookings(companyId, () => {
		refetchBookings();
	});

	const {
		services,
		newService,
		setNewService,
		editingService,
		setEditingService,
		editForm,
		setEditForm,
		addService,
		deleteService,
		handleEditSubmit,
		isSaving,
	} = useServices(companyId);

	if (loading)
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
				<div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-transparent rounded-full mb-4"></div>
				<p>Loading your dashboard...</p>
			</div>
		);

	if (error)
		return (
			<div className="text-center py-10 text-red-500 text-lg font-medium">
				{error}
			</div>
		);

	return (
		<div className="pt-28 pb-16 max-w-7xl mx-auto px-6 space-y-12">
			{/* STRIPE CONNECT */}
			<StripeConnectCard companyId={companyId} />

			{/* BUSINESS INFO */}
			<BusinessInfoCard companyId={companyId} />

			{/* STATS */}
			<StatsCards
				totalBookings={totalBookings}
				totalPaid={totalPaid}
				totalRevenue={totalRevenue}
			/>

			{/* BOOKINGS TABLE */}
			<section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
				<div className="p-4 flex items-center justify-between border-b bg-gray-50/70">
					<h2 className="font-semibold text-gray-800 flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-blue-500" />
						Recent Bookings
					</h2>
					<span className="text-sm text-gray-400">
						{bookings.length} record{bookings.length !== 1 && "s"}
					</span>
				</div>

				<BookingsTable
					bookings={bookings}
					total={total}
					page={page}
					setPage={setPage}
					updateStatus={updateBookingStatus}
					hasPending={hasPending}
				/>
			</section>

			{/* SERVICES SECTION */}
			<section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
				<div className="p-4 flex items-center justify-between border-b bg-gray-50/70">
					<h2 className="font-semibold text-gray-800 flex items-center gap-2">
						Services
					</h2>
					<span className="text-sm text-gray-400">
						{services.length} service{services.length !== 1 && "s"}
					</span>
				</div>

				<ServicesSection
					services={services}
					newService={newService}
					setNewService={setNewService}
					addService={addService}
					deleteService={deleteService}
					editingService={editingService}
					setEditingService={setEditingService}
					editForm={editForm}
					setEditForm={setEditForm}
					handleEditSubmit={handleEditSubmit}
					isSaving={isSaving}
				/>
			</section>

			{/* SERVICE AREA NAV */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-xl border border-gray-200 bg-white shadow-sm p-6"
			>
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
							Service Area
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Define the radius or geographical area where your company
							operates.
						</p>
					</div>

					<Button
						onClick={() => (window.location.href = "/dashboard/service-area")}
						className="bg-blue-600 hover:bg-blue-700 text-white"
					>
						Manage Service Area
					</Button>
				</div>
			</motion.div>
		</div>
	);
}
