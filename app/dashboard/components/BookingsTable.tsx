"use client";

import { motion } from "framer-motion";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/app/components/ui/table";

export default function BookingsTable({
	bookings,
	total,
	page,
	setPage,
	updateStatus,
	hasPending,
}: any) {
	const limit = 10;

	return (
		<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
			{/* HEADER */}
			<div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
				<span className="text-sm text-gray-400">
					{bookings.length} record{bookings.length !== 1 && "s"}
				</span>
			</div>

			{/* TABLE */}
			<Table>
				<TableHeader>
					<TableRow className="bg-gray-50">
						<TableHead>Customer</TableHead>
						<TableHead>Service</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Slot</TableHead>
						<TableHead>Address</TableHead>
						<TableHead>Status</TableHead>
						{hasPending && <TableHead>Actions</TableHead>}
						<TableHead>Paid</TableHead>
						<TableHead>Receipt</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{bookings.length > 0 ? (
						bookings.map((b: any, i: number) => (
							<motion.tr
								key={b.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.05 }}
								className="hover:bg-gray-50 transition-all"
							>
								{/* CUSTOMER */}
								<TableCell>
									<p className="font-medium text-gray-800">
										{b.customer.firstName} {b.customer.lastName}
									</p>
									<p className="text-xs text-gray-500">{b.customer.email}</p>
								</TableCell>

								{/* SERVICE */}
								<TableCell className="font-medium text-gray-700">
									{b.serviceType}
								</TableCell>

								{/* DATE */}
								<TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>

								{/* SLOT */}
								<TableCell>{b.slot}</TableCell>

								{/* ADDRESS */}
								<TableCell className="max-w-[220px] truncate">
									{b.address ? (
										<a
											href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
												b.address
											)}`}
											target="_blank"
											className="text-blue-600 hover:underline"
										>
											{b.address}
										</a>
									) : (
										"—"
									)}
								</TableCell>

								{/* STATUS */}
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

								{/* ACTIONS */}
								{hasPending && (
									<TableCell className="space-x-2 text-center w-[180px]">
										{b.status === "pending" ? (
											<>
												<Button
													size="sm"
													variant="outline"
													onClick={() => updateStatus(b.id, "completed")}
													className="hover:bg-green-100 text-green-600 border-green-200"
												>
													Mark Complete
												</Button>

												<Button
													size="sm"
													variant="outline"
													onClick={() => updateStatus(b.id, "canceled")}
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

								{/* PAID */}
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

								{/* RECEIPT */}
								<TableCell>
									{b.paid && b.paymentReceiptUrl ? (
										<a
											href={b.paymentReceiptUrl}
											target="_blank"
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
								colSpan={9}
								className="text-center py-12 text-gray-400"
							>
								No bookings found.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{/* PAGINATION */}
			<div className="flex items-center justify-center gap-4 py-6 border-t border-gray-100">
				<Button
					variant="outline"
					onClick={() => setPage((p: number) => Math.max(1, p - 1))}
					disabled={page === 1}
				>
					Previous
				</Button>

				<span className="text-sm text-gray-600">
					Page {page} of {Math.max(1, Math.ceil(total / limit))}
				</span>

				<Button
					variant="outline"
					onClick={() => setPage((p: number) => p + 1)}
					disabled={page >= Math.ceil(total / limit)}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
