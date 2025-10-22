"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import {
	RefreshCcw,
	Users,
	DollarSign,
	ClipboardList,
	TrendingUp,
	Plus,
	Trash,
	Pencil,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/app/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
interface DashboardClientProps {
	companyId: string;
}

interface Booking {
	id: string;
	serviceType: string;
	date: string;
	slot: string;
	status: string;
	paid: boolean;
	address: string | null;
	paymentReceiptUrl: string | null;
	amountCents: number | null;
	addressLat: number | null;
	addressLng: number | null;
	customer: { firstName: string; lastName: string; email: string };
}

interface Service {
	id: string;
	name: string;
	priceCents: number | null;
	durationText: string | null;
}

export default function DashboardClient({ companyId }: DashboardClientProps) {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const limit = 10;
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [newService, setNewService] = useState({
		name: "",
		price: "",
		durationText: "",
	});
	const [editingService, setEditingService] = useState<Service | null>(null);
	const [editForm, setEditForm] = useState({
		name: "",
		price: "",
		duration: "",
	});
	const [isSaving, setIsSaving] = useState(false);

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

	async function fetchServices() {
		try {
			const res = await fetch(`/api/company/${companyId}/services`);
			const data = await res.json();
			setServices(data.services || []);
		} catch (err) {
			console.error("❌ Error fetching services:", err);
		}
	}

	async function addService() {
		if (!newService.name.trim()) return;
		await fetch(`/api/company/${companyId}/services`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newService.name,
				priceCents: parseInt(newService.price || "0") * 100,
				durationText: newService.durationText || "",
			}),
		});
		setNewService({ name: "", price: "", durationText: "" });
		fetchServices();
	}

	async function deleteService(serviceId: string) {
		try {
			const res = await fetch(
				`/api/company/${companyId}/services/${serviceId}`,
				{
					method: "DELETE",
				}
			);
			if (!res.ok) throw new Error("Failed to delete service");
			fetchServices();
		} catch (err) {
			console.error("❌ Error deleting service:", err);
		}
	}

	async function handleEditSubmit() {
		if (!editingService) return;

		setIsSaving(true);
		try {
			const res = await fetch(
				`/api/company/${companyId}/services/${editingService.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: editForm.name.trim(),
						priceCents: parseInt(editForm.price || "0") * 100,
						durationText: editForm.duration.trim(),
					}),
				}
			);

			if (!res.ok) throw new Error("Failed to update service");

			await fetchServices();
			setEditingService(null);
		} catch (err) {
			console.error("❌ Error updating service:", err);
		} finally {
			setIsSaving(false);
		}
	}

	const updateBookingStatus = async (
		bookingId: string,
		status: "completed" | "canceled"
	) => {
		try {
			const res = await fetch(
				`/api/company/${companyId}/booking/${bookingId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status }),
				}
			);
			if (res.ok) {
				await fetchBookings();
			} else {
				console.error(`❌ Failed to mark booking as ${status}`);
			}
		} catch (error) {
			console.error(`❌ Error updating booking status to ${status}:`, error);
		}
	};

	useEffect(() => {
		if (!companyId) return;

		fetchBookings();
		fetchServices();

		type BookingChange = {
			id: string;
			companyId: string;
			paid?: boolean;
			status?: string;
			[key: string]: any;
		};

		const channel = supabase
			.channel("booking-updates")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "Booking",
				},
				(payload) => {
					const record = (payload.new || payload.old) as BookingChange;
					if (record.companyId === companyId) {
						clearTimeout((window as any).__fetchTimeout);
						(window as any).__fetchTimeout = setTimeout(fetchBookings, 400);
					}
				}
			)
			.subscribe();

		channel.on("broadcast", { event: "booking-updated" }, (payload) => {
			if (payload?.companyId === companyId) {
				fetchBookings();
				toast.success(
					`Booking ${payload.status === "confirmed" ? "confirmed" : "canceled"}!`
				);
			}
		});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [companyId, page]);

	if (loading)
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
				<div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-transparent rounded-full mb-4"></div>
				<p>Loading your dashboard...</p>
			</div>
		);

	if (error)
		return <div className="text-red-500 text-center py-10">{error}</div>;

	const totalBookings = bookings.length;
	const totalPaid = bookings.filter((b) => b.paid).length;
	const totalRevenue = bookings.reduce(
		(sum, b) => sum + (b.paid ? (b.amountCents ?? 0) : 0),
		0
	);

	const hasPendingBookings = bookings.some((b) => b.status === "pending");

	return (
		<div className="max-w-6xl mx-auto px-6 pt-24 pb-16 space-y-20">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-r from-zinc-800 via-neutral-700 to-zinc-500 dark:from-zinc-100 dark:via-neutral-300 dark:to-zinc-400 bg-clip-text text-transparent">
					Company Dashboard
				</h1>

				<Button
					variant="outline"
					onClick={() => {
						fetchBookings();
						fetchServices();
					}}
					className="flex gap-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
				>
					<RefreshCcw className="w-4 h-4" /> Refresh
				</Button>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
						<DollarSign className="w-5 h-5 text-blue-500" />
						Stripe Payments
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Connect your Stripe account to receive customer payments directly.
					</p>
				</div>

				<Button
					onClick={async () => {
						const res = await fetch("/api/stripe/connect", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ companyId: companyId }),
						});
						const data = await res.json();
						if (data.url) {
							window.location.href = data.url;
						} else {
							alert(data.error || "Error connecting Stripe");
						}
					}}
					className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
				>
					Connect with Stripe
				</Button>
			</div>

			{/* STATS CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{[
					{
						icon: ClipboardList,
						label: "Total Bookings",
						value: totalBookings,
						color: "from-indigo-500 to-blue-400",
					},
					{
						icon: Users,
						label: "Paid Customers",
						value: totalPaid,
						color: "from-emerald-500 to-green-400",
					},
					{
						icon: DollarSign,
						label: "Total Revenue",
						value: `$${(totalRevenue / 100).toLocaleString(undefined, {
							minimumFractionDigits: 2,
						})}`,
						color: "from-amber-500 to-orange-400",
					},
				].map((card, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
					>
						<div className="flex items-center gap-3 mb-2">
							<div
								className={`p-2 rounded-lg bg-gradient-to-r ${card.color} text-white shadow-sm`}
							>
								<card.icon className="w-5 h-5" />
							</div>
							<span className="text-2xl font-semibold text-gray-900">
								{card.value}
							</span>
						</div>
						<p className="text-sm text-gray-500 font-medium">{card.label}</p>
					</motion.div>
				))}
			</div>

			{/* BOOKINGS TABLE */}
			<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
				<div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
					<h2 className="font-semibold text-gray-800 flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-blue-500" /> Recent Bookings
					</h2>
					<span className="text-sm text-gray-400">
						{bookings.length} record{bookings.length !== 1 && "s"}
					</span>
				</div>

				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50">
							<TableHead>Customer</TableHead>
							<TableHead>Service</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Slot</TableHead>
							<TableHead>Address</TableHead>
							<TableHead>Status</TableHead>
							{hasPendingBookings && <TableHead>Actions</TableHead>}
							<TableHead>Paid</TableHead>
							<TableHead>Receipt</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{bookings.length > 0 ? (
							bookings.map((b, i) => (
								<motion.tr
									key={b.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.05 }}
									className="hover:bg-gray-50 transition-all"
								>
									<TableCell>
										<p className="font-medium text-gray-800">
											{b.customer.firstName} {b.customer.lastName}
										</p>
										<p className="text-xs text-gray-500">{b.customer.email}</p>
									</TableCell>

									<TableCell className="font-medium text-gray-700">
										{b.serviceType}
									</TableCell>

									<TableCell className="text-gray-600">
										{new Date(b.date).toLocaleDateString()}
									</TableCell>

									<TableCell className="text-gray-600">{b.slot}</TableCell>

									<TableCell className="max-w-[220px] truncate text-gray-600">
										{b.address ? (
											<a
												href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
													b.address
												)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{b.address}
											</a>
										) : (
											"—"
										)}
									</TableCell>

									<TableCell>
										<Badge
											variant={
												b.status === "confirmed"
													? "default"
													: b.status === "pending"
														? "secondary"
														: "outline"
											}
										>
											{b.status}
										</Badge>
									</TableCell>

									{hasPendingBookings && (
										<TableCell className="space-x-2 text-center w-[180px]">
											{b.status === "pending" ? (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															updateBookingStatus(b.id, "completed")
														}
														className="hover:bg-green-100 text-green-600 border-green-200"
													>
														Mark Complete
													</Button>

													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															updateBookingStatus(b.id, "canceled")
														}
														className="hover:bg-red-100 text-red-600 border-red-200"
													>
														Cancel
													</Button>
												</>
											) : (
												<span className="text-gray-400 text-sm italic">—</span>
											)}
										</TableCell>
									)}

									<TableCell>
										<Badge
											variant={b.paid ? "default" : "outline"}
											className={
												b.paid
													? "bg-green-100 text-green-800 border-green-200"
													: "bg-gray-100 text-gray-600 border-gray-200"
											}
										>
											{b.paid ? "Paid" : "Unpaid"}
										</Badge>
									</TableCell>

									<TableCell>
										{b.paid && b.paymentReceiptUrl ? (
											<a
												href={b.paymentReceiptUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												View
											</a>
										) : (
											"-"
										)}
									</TableCell>
								</motion.tr>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={hasPendingBookings ? 9 : 8}
									className="text-center py-12 text-gray-400"
								>
									No bookings found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				{/* PAGINATION CONTROLS */}
				<div className="flex items-center justify-center gap-4 py-6 border-t border-gray-100">
					<Button
						variant="outline"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						Previous
					</Button>

					<span className="text-sm text-gray-600">
						Page {page} of {Math.max(1, Math.ceil(total / limit))}
					</span>

					<Button
						variant="outline"
						onClick={() =>
							setPage((p) => Math.min(Math.ceil(total / limit), p + 1))
						}
						disabled={page >= Math.ceil(total / limit)}
					>
						Next
					</Button>
				</div>
			</div>

			{/* SERVICES TABLE */}
			<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
				<div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
					<h2 className="font-semibold text-gray-800 flex items-center gap-2">
						<ClipboardList className="w-4 h-4 text-indigo-500" /> Services
					</h2>
					<span className="text-sm text-gray-400">
						{services.length} service{services.length !== 1 && "s"}
					</span>
				</div>

				{/* ADD SERVICE */}
				<div className="flex flex-wrap gap-2 p-4 border-b border-gray-100 bg-gray-50/50">
					<Input
						placeholder="Service name"
						value={newService.name}
						onChange={(e) =>
							setNewService({ ...newService, name: e.target.value })
						}
						className="w-48"
					/>
					<Input
						placeholder="Price ($)"
						type="number"
						value={newService.price}
						onChange={(e) =>
							setNewService({ ...newService, price: e.target.value })
						}
						className="w-32"
					/>
					<Input
						placeholder="Duration"
						type="text"
						value={newService.durationText}
						onChange={(e) =>
							setNewService({ ...newService, durationText: e.target.value })
						}
						className="w-32"
					/>
					<Button onClick={addService} className="hover:bg-gray-200">
						<Plus className="w-4 h-4 " /> Add
					</Button>
				</div>

				{/* SERVICE LIST */}
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-50">
							<TableHead>Name</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{services.length > 0 ? (
							services.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="font-medium">{s.name}</TableCell>
									<TableCell>${(s.priceCents ?? 0) / 100}</TableCell>
									<TableCell>{s.durationText || "-"}</TableCell>
									<TableCell className="text-right">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="hover:bg-red-100"
												>
													<Trash className="w-4 h-4 text-red-500" />
												</Button>
											</AlertDialogTrigger>

											<AlertDialogContent className="bg-white text-black">
												<AlertDialogHeader>
													<AlertDialogTitle>Delete Service</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to delete{" "}
														<strong>{s.name}</strong>? This action cannot be
														undone.
													</AlertDialogDescription>
												</AlertDialogHeader>

												<AlertDialogFooter>
													<AlertDialogCancel className="hover:bg-gray-200">
														Cancel
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => deleteService(s.id)}
														className="bg-red-600 hover:bg-red-700 text-white"
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
										<Dialog
											open={editingService?.id === s.id}
											onOpenChange={(open) => {
												if (open) {
													setEditingService(s);
													setEditForm({
														name: s.name,
														price: s.priceCents
															? (s.priceCents / 100).toString()
															: "",
														duration: s.durationText || "",
													});
												} else {
													setEditingService(null);
												}
											}}
										>
											<DialogTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="hover:bg-blue-300"
												>
													<Pencil className="w-4 h-4 text-blue-500" />
												</Button>
											</DialogTrigger>

											<DialogContent className="sm:max-w-md bg-white">
												<DialogHeader>
													<DialogTitle>Edit Service</DialogTitle>
													<DialogDescription>
														Update the details for <strong>{s.name}</strong>.
													</DialogDescription>
												</DialogHeader>

												<div className="space-y-3 py-4">
													<div>
														<Label htmlFor="name">Service Name</Label>
														<Input
															id="name"
															value={editForm.name}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	name: e.target.value,
																})
															}
														/>
													</div>

													<div>
														<Label htmlFor="price">Price ($)</Label>
														<Input
															id="price"
															type="number"
															value={editForm.price}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	price: e.target.value,
																})
															}
														/>
													</div>

													<div>
														<Label htmlFor="duration">Duration</Label>
														<Input
															id="duration"
															value={editForm.duration}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	duration: e.target.value,
																})
															}
														/>
													</div>
												</div>

												<DialogFooter>
													<Button
														className="hover:bg-gray-200"
														variant="outline"
														onClick={() => setEditingService(null)}
													>
														Cancel
													</Button>
													<Button
														className="hover:bg-blue-400 hover:text-white"
														onClick={handleEditSubmit}
														disabled={isSaving}
													>
														{isSaving ? "Saving..." : "Save Changes"}
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center py-10 text-gray-400"
								>
									No services found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
