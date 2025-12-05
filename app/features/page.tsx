"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
	MapPin,
	ShieldCheck,
	Zap,
	Clock,
	Cpu,
	ArrowRight,
	Target,
	Activity,
	User,
	GitFork,
	CheckCircle,
	TrendingUp,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- CORE COMPONENTS (REUSED) ---

// Spotlight Card Component (The high-end interactive card)
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
				"relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 transition-colors hover:border-white/20 p-6 flex flex-col justify-between cursor-pointer group hover:shadow-2xl hover:shadow-blue-900/10",
				className
			)}
		>
			<div
				className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
				style={{
					opacity,
					background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(125, 211, 252, 0.2), transparent 40%)`,
				}}
			/>
			<div className="relative z-10 h-full">{children}</div>
		</Link>
	);
};

// Simplified Navbar for visual context on this page

// --- ELEVATED FEATURE DATA ---
const platformFeatures = [
	{
		title: "Hyper-Optimized Matching",
		description:
			"Our proprietary engine processes millions of data points—location, urgency, specialty, reputation—to achieve a 99.8% first-match success rate.",
		icon: Zap,
		color: "text-cyan-400",
		bg: "bg-cyan-500/10",
		border: "border-cyan-500/20",
	},
	{
		title: "Zero-Trust Vetting Layer",
		description:
			"Beyond simple background checks, we employ continuous monitoring, licensing verification, and a peer review system for unparalleled professional assurance.",
		icon: ShieldCheck,
		color: "text-green-400",
		bg: "bg-green-500/10",
		border: "border-green-500/20",
	},
	{
		title: "Predictive Pricing Intelligence",
		description:
			"Leveraging historical data and current market rates, we provide dynamic, fixed-price estimates before the quote is even issued, ensuring total transparency.",
		icon: TrendingUp,
		color: "text-purple-400",
		bg: "bg-purple-500/10",
		border: "border-purple-500/20",
	},
	{
		title: "Visual AI Diagnostics",
		description:
			"Upload a picture or video of the issue. Our AI instantly classifies the job, tags required skills, and accelerates provider readiness before they arrive.",
		icon: Cpu,
		color: "text-red-400",
		bg: "bg-red-500/10",
		border: "border-red-500/20",
	},
	{
		title: "Atomic Job Timeline",
		description:
			"From dispatch to completion, view a granular, encrypted log of every milestone. Know exactly where your provider is and what work is being performed.",
		icon: Clock,
		color: "text-yellow-400",
		bg: "bg-yellow-500/10",
		border: "border-yellow-500/20",
	},
	{
		title: "Escrow-Protected Transactions",
		description:
			"Payment is secured in a dedicated escrow account and released only when you digitally sign off on the satisfactory completion of the service.",
		icon: CheckCircle,
		color: "text-indigo-400",
		bg: "bg-indigo-500/10",
		border: "border-indigo-500/20",
	},
];

// --- SIGNATURE TECHNOLOGY COMPONENT ---
const CoreTechnologySection = () => (
	<section className="py-24 px-6 relative overflow-hidden">
		<div className="max-w-7xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true, amount: 0.3 }}
				className="text-center mb-16 relative z-10"
			>
				<span className="text-sm font-semibold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
					Proprietary Algorithm
				</span>
				<h2 className="text-5xl md:text-6xl font-extrabold text-white mt-4 tracking-tighter">
					The GeoServ Hyper-Optimization Engine
				</h2>
				<p className="text-xl text-neutral-400 max-w-4xl mx-auto mt-4">
					We don't just connect. We compute. Our machine learning models ensure
					precision matching and optimal resource allocation, reducing wait
					times by 60%.
				</p>
			</motion.div>

			{/* Visualizer Block (Highly styled, technical look) */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				whileInView={{ opacity: 1, scale: 1 }}
				transition={{ duration: 1.0, delay: 0.2 }}
				viewport={{ once: true, amount: 0.2 }}
				className="relative p-8 md:p-16 rounded-[40px] bg-neutral-950 border border-blue-500/20 shadow-[0_0_100px_rgba(37,99,235,0.2)]"
			>
				{/* Internal Glow Effect */}
				<div
					className="absolute inset-0 rounded-[40px] [mask-image:radial-gradient(at_center,white,transparent)]"
					style={{
						background:
							"linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)",
						filter: "blur(10px)",
					}}
				/>

				<div className="relative grid md:grid-cols-3 gap-12 text-center z-10">
					<div className="flex flex-col items-center">
						<GitFork className="h-10 w-10 text-cyan-400 mb-3 animate-pulse-slow" />
						<p className="text-2xl font-bold text-white mb-2">Input Layer</p>
						<p className="text-neutral-500">
							Service Request, Location Pin, Urgency Score, User History.
						</p>
					</div>
					<div className="flex-col items-center relative before:content-[''] before:absolute before:h-full before:w-px before:bg-blue-600/20 before:left-[-15%] after:content-[''] after:absolute after:h-full after:w-px after:bg-blue-600/20 after:right-[-15%] md:before:block md:after:block hidden md:flex md:flex-col">
						<Cpu className="h-10 w-10 text-blue-500 mb-3 animate-spin-slow" />
						<p className="text-2xl font-bold text-white mb-2">
							Processing Core
						</p>
						<p className="text-neutral-500">
							ML Vetting, Route Planning, Predictive Availability & Bid
							Optimization.
						</p>
					</div>
					<div className="flex flex-col items-center">
						<Target className="h-10 w-10 text-green-400 mb-3 animate-bounce-slow" />
						<p className="text-2xl font-bold text-white mb-2">Output Match</p>
						<p className="text-neutral-500">
							Single Best Provider, Fixed Quote, Guaranteed 15-Minute Response
							Time.
						</p>
					</div>
				</div>

				<div className="text-center mt-12">
					<Link
						href="/technology"
						className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors"
					>
						Learn more about our Tech Stack
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</motion.div>
		</div>
	</section>
);

export default function FeaturesPage() {
	return (
		<div className="min-h-screen bg-[#000000] text-neutral-200 font-sans overflow-x-hidden pt-20">
			{/* Background Atmosphere */}
			<div className="fixed inset-0 pointer-events-none -z-20">
				{/* Deep dark grain effect */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.02),transparent_75%)]" />

				{/* Subtle moving glows */}
				<div className="absolute left-1/4 top-[-10%] w-[800px] h-[400px] bg-indigo-900/10 blur-[200px] rounded-full animate-pulse-slow" />
				<div className="absolute right-0 bottom-[-5%] w-[600px] h-[350px] bg-red-900/10 blur-[200px] rounded-full" />
			</div>

			{/* HERO SECTION */}
			<section className="pt-24 pb-16 md:pt-40 md:pb-24 px-6 text-center max-w-6xl mx-auto relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-widest rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
						Engineered for Excellence
					</span>
					<h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 mb-6 leading-none">
						Unlocking Service Confidence.
					</h1>

					<p className="text-xl md:text-2xl text-neutral-400 max-w-4xl mx-auto mb-10">
						GeoServ redefines home service with technology that guarantees
						quality, transparency, and a perfect match every single time.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
				>
					<Link
						href="/match"
						className="inline-flex items-center gap-3 px-10 py-4 text-xl font-semibold rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 hover:bg-blue-500 transition-all duration-300 transform hover:-translate-y-1"
					>
						Find Your Service Pro
						<ArrowRight className="h-6 w-6" />
					</Link>
				</motion.div>
			</section>

			{/* SIGNATURE CORE TECHNOLOGY SECTION */}
			<CoreTechnologySection />

			{/* FEATURE MATRIX GRID */}
			<section className="py-16 md:py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<motion.h2
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, amount: 0.5 }}
						transition={{ duration: 0.5 }}
						className="text-4xl md:text-5xl font-bold text-white mb-16 tracking-tighter text-center"
					>
						Features that elevate your experience
					</motion.h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{platformFeatures.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 50 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, amount: 0.2 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
							>
								<SpotlightCard
									href="#"
									className={`h-64 ${feature.bg} border-white/10`}
								>
									<div className="flex-1">
										<div
											className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bg} border ${feature.border} ${feature.color} transition-all shadow-lg shadow-black/20`}
										>
											<feature.icon className="h-7 w-7" />
										</div>
										<h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-neutral-50 transition-colors">
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

			{/* FINAL CTA */}
			<section className="py-24 px-6">
				<div className="max-w-5xl mx-auto text-center p-12 rounded-[30px] border border-white/10 bg-gradient-to-br from-blue-900/20 to-neutral-950 relative overflow-hidden shadow-2xl shadow-blue-900/30">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.5 }}
						transition={{ duration: 0.5 }}
						className="relative z-10"
					>
						<User className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter">
							Experience the GeoServ Standard.
						</h2>
						<p className="text-lg text-neutral-400 max-w-xl mx-auto mb-8">
							Ready for service that is simple, transparent, and always
							reliable?
						</p>
						<Link
							href="/match"
							className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 hover:bg-blue-500 transition-all duration-300 transform hover:-translate-y-1"
						>
							Start Your Request Now
							<Activity className="h-5 w-5" />
						</Link>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
