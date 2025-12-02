"use client";

import { ClipboardList, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsCards({
	totalBookings,
	totalPaid,
	totalRevenue,
}: any) {
	const cards = [
		{
			icon: ClipboardList,
			label: "Total Bookings",
			value: totalBookings,
			color: "from-indigo-500 via-blue-500 to-blue-400",
			iconBg: "bg-indigo-500/10 text-indigo-600",
		},
		{
			icon: Users,
			label: "Paid Customers",
			value: totalPaid,
			color: "from-emerald-500 via-green-500 to-green-400",
			iconBg: "bg-emerald-500/10 text-emerald-600",
		},
		{
			icon: DollarSign,
			label: "Total Revenue",
			value: `$${(totalRevenue / 100).toLocaleString(undefined, {
				minimumFractionDigits: 2,
			})}`,
			color: "from-amber-500 via-orange-500 to-orange-400",
			iconBg: "bg-amber-500/10 text-amber-600",
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
			{cards.map((card, i) => (
				<motion.div
					key={i}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.1, duration: 0.4 }}
					className="
            group relative overflow-hidden rounded-2xl border border-gray-200
            bg-white shadow-sm hover:shadow-xl transition-all duration-300
            hover:-translate-y-1 cursor-pointer"
				>
					<div
						className={`
              absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity
              bg-gradient-to-br ${card.color}
            `}
					/>

					<div className="relative p-6">
						<div className="flex items-center gap-4">
							<div
								className={`
                  ${card.iconBg} p-3 rounded-xl flex items-center justify-center
                  shadow-inner
                `}
							>
								<card.icon className="w-6 h-6" />
							</div>

							<div className="flex flex-col">
								{/* Value */}
								<span className="text-3xl font-bold tracking-tight text-gray-900">
									{card.value}
								</span>
								{/* Label */}
								<span className="text-sm text-gray-500">{card.label}</span>
							</div>
						</div>
					</div>

					<div
						className={`h-1 w-full bg-gradient-to-r ${card.color} mt-2 opacity-70 group-hover:opacity-100 transition-all`}
					/>
				</motion.div>
			))}
		</div>
	);
}
