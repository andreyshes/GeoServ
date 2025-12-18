"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
	MapPin,
	Target,
	BadgeCheck,
	DollarSign,
	CalendarCheck,
	Briefcase,
	ArrowRight,
	User,
	Zap,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const SpotlightCard = ({
	children,
	className = "",
	href = "#",
}: {
	children: React.ReactNode;
	className?: string;
	href?: string;
}) => {
	const divRef = useRef<HTMLAnchorElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [opacity, setOpacity] = useState(0);

	const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (!divRef.current) return;
		const rect = divRef.current.getBoundingClientRect();
		setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
	};

	const handleMouseEnter = () => setOpacity(1);
	const handleMouseLeave = () => setOpacity(0);

	return (
		<Link
			ref={divRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			href={href}
			className={cn(
				"relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 transition-colors hover:border-white/20 p-6 flex flex-col justify-between cursor-pointer group",
				className
			)}
		>
			<div
				className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
				style={{
					opacity,
					background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(37, 99, 235, 0.15), transparent 40%)`,
				}}
			/>
			<div className="relative z-10 h-full">{children}</div>
		</Link>
	);
};

// --- CATEGORY DATA for Business Page ---
const businessFeatures = [
	{
		title: "Qualified Leads Only",
		description:
			"Our AI prioritizes customer needs and your specialty, delivering only high-intent, targeted requests directly to your schedule.",
		icon: Target,
	},
	{
		title: "Automated Payments",
		description:
			"Stop chasing invoices. GeoServ handles billing, taxes, and direct deposit, so you get paid instantly upon job completion.",
		icon: DollarSign,
	},
	{
		title: "Zero Upfront Cost",
		description:
			"Start growing your business immediately with no subscription fees or costly marketing campaigns. Only pay for successful jobs.",
		icon: Briefcase,
	},
	{
		title: "Reputation Management",
		description:
			"Build a verified profile with real-time customer ratings that drive repeat business and establish market trust.",
		icon: BadgeCheck,
	},
	{
		title: "Dynamic Scheduling",
		description:
			"Optimize your route and fill gaps with our smart scheduling tool that integrates new jobs seamlessly with your existing calendar.",
		icon: CalendarCheck,
	},
	{
		title: "Dedicated Support",
		description:
			"Access a dedicated partner success team ready to help you optimize your profile and maximize your service radius.",
		icon: User,
	},
];

export default function BusinessPage() {
	return (
		<div className="min-h-screen bg-[#030303] text-neutral-200 font-sans overflow-x-hidden pt-20">
			<div className="fixed inset-0 pointer-events-none -z-20">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
				{/* Subtle moving glows */}
				<div className="absolute left-0 top-[20%] w-[600px] h-[350px] bg-green-500/10 blur-[150px] rounded-full animate-pulse-slow" />
				<div className="absolute right-0 bottom-[10%] w-[500px] h-[300px] bg-blue-500/10 blur-[150px] rounded-full" />
			</div>

			<section className="pt-24 pb-16 md:pt-36 md:pb-24 px-6 text-center max-w-6xl mx-auto relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-widest rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
						Grow Your Service
					</span>
					<h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-neutral-400 mb-6 leading-tight">
						Modernize Your Business.
						<br className="hidden md:inline" /> Secure Higher Quality Leads.
					</h1>

					<p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-10">
						GeoServ connects elite, vetted service professionals with customers
						ready to hire. Focus on your craft, we handle the rest.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<Link
						href="/auth/register"
						className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-full bg-green-600 text-white shadow-xl shadow-green-600/30 hover:bg-green-500 transition-all duration-300 transform hover:-translate-y-0.5"
					>
						Join GeoServ Today
						<ArrowRight className="h-5 w-5" />
					</Link>
				</motion.div>
			</section>

			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<motion.h2
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, amount: 0.5 }}
						transition={{ duration: 0.5 }}
						className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight text-center"
					>
						Features built for scale
					</motion.h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{businessFeatures.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true, amount: 0.2 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<SpotlightCard href="#">
									<div className="flex-1">
										<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20 transition-all">
											<feature.icon className="h-7 w-7" />
										</div>
										<h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
											{feature.title}
										</h3>
									</div>
									<p className="text-neutral-400 text-base">
										{feature.description}
									</p>
								</SpotlightCard>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			<section className="py-16 md:py-24 px-6">
				<div className="max-w-5xl mx-auto text-center p-12 rounded-3xl border border-white/10 bg-neutral-900 relative overflow-hidden shadow-2xl shadow-black/30">
					<div className="absolute inset-0 bg-blue-500/5 opacity-10 blur-3xl rounded-full animate-pulse-slowest" />

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.5 }}
						transition={{ duration: 0.5 }}
						className="relative z-10"
					>
						<Zap className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
						<h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
							Ready to take control?
						</h2>
						<p className="text-lg text-neutral-400 max-w-xl mx-auto mb-8">
							It only takes 5 minutes to create your profile and start receiving
							your first qualified service requests.
						</p>
						<Link
							href="/auth/register"
							className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-full bg-green-600 text-white shadow-xl shadow-green-600/30 hover:bg-green-500 transition-all duration-300 transform hover:-translate-y-0.5"
						>
							Start Accepting Jobs
							<ArrowRight className="h-5 w-5" />
						</Link>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
