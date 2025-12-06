"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
	motion
} from "framer-motion";
import {
	MapPin,
	ShieldCheck,
	Building2,
	Briefcase,
	ArrowRight,
	CheckCircle2,
	Menu,
	X,
	Zap,
	Clock,
	ChevronRight,
	Star,
	Globe,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const SpotlightCard = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	const divRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [opacity, setOpacity] = useState(0);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!divRef.current) return;
		const rect = divRef.current.getBoundingClientRect();
		setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
	};

	const handleMouseEnter = () => setOpacity(1);
	const handleMouseLeave = () => setOpacity(0);

	return (
		<div
			ref={divRef}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 transition-colors hover:border-white/20",
				className
			)}
		>
			<div
				className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
				style={{
					opacity,
					background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
				}}
			/>
			<div className="relative h-full">{children}</div>
		</div>
	);
};

const Button = ({
	children,
	variant = "primary",
	className = "",
	icon: Icon,
	asChild = false,
	...props
}: {
	children: React.ReactNode;
	variant?: "primary" | "secondary" | "glow" | "ghost";
	className?: string;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	onClick?: () => void;
	asChild?: boolean;
}) => {
	const base =
		"group inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-black active:scale-95";

	const variants = {
		primary:
			"bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5",
		secondary:
			"bg-neutral-900 text-white border border-white/10 hover:bg-neutral-800 hover:border-white/20",
		glow: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] border border-blue-500/20",
		ghost: "text-neutral-400 hover:text-white hover:bg-white/5",
	};
	const Component: any = asChild ? "span" : "button";

	return (
		<Component className={cn(base, variants[variant], className)} {...props}>
			{children}
			{Icon && (
				<Icon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
			)}
		</Component>
	);
};

const LogoTicker = () => (
	<div className="w-full overflow-hidden border-y border-white/5 bg-black/20 py-10">
		<div className="max-w-7xl mx-auto px-6 mb-6 text-center">
			<p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
				Trusted by top home service providers
			</p>
		</div>
		<div className="relative flex overflow-x-hidden group">
			<div className="animate-marquee flex whitespace-nowrap gap-20 items-center">
				{/* Mock Logos - repeated twice for seamless loop */}
				{[...Array(2)].map((_, i) => (
					<React.Fragment key={i}>
						{[
							"Acme Plumbing",
							"TechHome",
							"Spark Electric",
							"GreenLeaf",
							"BuildRight",
							"SafeGuard",
						].map((name) => (
							<span
								key={name}
								className="text-2xl font-bold text-neutral-700 mx-4"
							>
								{name}
							</span>
						))}
					</React.Fragment>
				))}
			</div>
			<div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-10" />
			<div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-10" />
		</div>
	</div>
);

// --- MAIN PAGE ---

export default function HomePage() {
	return (
		<div className="min-h-screen bg-[#030303] text-neutral-200 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative">
			{/* Global Grain Texture for Film Effect */}
			<div
				className="fixed inset-0 pointer-events-none opacity-[0.03] z-[60] mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
				}}
			></div>

			{/* Dynamic Background */}
			<div className="fixed inset-0 pointer-events-none -z-10">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
				<div className="absolute left-1/2 top-[-10%] w-[1000px] h-[500px] -translate-x-1/2 bg-blue-600/20 blur-[120px] rounded-[100%] opacity-50 animate-pulse" />
				<div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full" />
			</div>

			{/* HERO SECTION */}
			<section className="pt-40 pb-20 md:pt-52 md:pb-32 px-6 relative z-10">
				<div className="max-w-7xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-8 backdrop-blur-sm"
					>
						<span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
						v2.0 is now live
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="text-5xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-500 mb-8 leading-[1.1] max-w-5xl mx-auto"
					>
						Local services. <br />
						<span className="text-white/40">Reinvented.</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
					>
						The operating system for local scheduling. Connect with verified
						providers through real-time validation, instant escrow, and zero
						friction.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						className="flex flex-col sm:flex-row justify-center gap-4 items-center"
					>
						<Button
							variant="secondary"
							icon={Briefcase}
							className="h-12 px-8 text-base w-full sm:w-auto"
						>
							For Business
						</Button>
					</motion.div>

					{/* Hero Visual/Dashboard Mockup Hint */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 40 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
						className="mt-20 relative mx-auto max-w-5xl"
					>
						<div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20" />
						<div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] aspect-[16/9] overflow-hidden shadow-2xl">
							{/* Abstract UI Representation */}
							<div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
								<div className="h-3 w-3 rounded-full bg-red-500/20" />
								<div className="h-3 w-3 rounded-full bg-yellow-500/20" />
								<div className="h-3 w-3 rounded-full bg-green-500/20" />
							</div>
							<div className="p-12 flex items-center justify-center h-full">
								<div className="text-center">
									<div className="h-20 w-20 bg-blue-500/10 rounded-full mx-auto mb-6 flex items-center justify-center border border-blue-500/20 animate-pulse">
										<Globe className="h-10 w-10 text-blue-500" />
									</div>
									<div className="h-4 w-48 bg-neutral-800 rounded-full mx-auto mb-3" />
									<div className="h-4 w-32 bg-neutral-800 rounded-full mx-auto" />
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<LogoTicker />

			{/* FEATURES - BENTO GRID */}
			<section className="py-32 px-6 relative">
				<div className="max-w-7xl mx-auto">
					<div className="mb-20">
						<h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
							Built for speed. <br />
							<span className="text-neutral-500">Designed for trust.</span>
						</h2>
						<p className="text-neutral-400 max-w-xl text-lg">
							We’ve re-engineered the booking process. No quotes, no phone tag.
							Just clean software.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
						{/* Large Card 1 */}
						<SpotlightCard className="md:col-span-2 p-10 flex flex-col justify-between group">
							<div className="absolute top-0 right-0 p-10 opacity-50 group-hover:opacity-100 transition-opacity">
								<div className="h-32 w-32 bg-blue-500/20 rounded-full blur-3xl" />
							</div>
							<div className="relative z-10">
								<div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
									<MapPin className="h-6 w-6" />
								</div>
								<h3 className="text-2xl font-semibold text-white mb-2">
									Real-time Geolocation
								</h3>
								<p className="text-neutral-400 max-w-md">
									Our matching engine uses sub-second API lookups to ensure
									providers are actually within driving distance of your
									property before they can accept the job.
								</p>
							</div>
						</SpotlightCard>

						{/* Tall Card */}
						<SpotlightCard className="md:row-span-2 p-10 bg-neutral-900/80">
							<div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
								<ShieldCheck className="h-6 w-6" />
							</div>
							<h3 className="text-xl font-bold text-white mb-3">
								Escrow Secured
							</h3>
							<p className="text-neutral-400 text-sm mb-8">
								Funds are held safely until the job is marked complete by both
								parties.
							</p>

							<div className="space-y-4">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4 backdrop-blur-sm"
									>
										<div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
											<CheckCircle2 className="h-4 w-4 text-green-500" />
										</div>
										<div className="flex-1">
											<div className="h-2 w-24 bg-neutral-700 rounded-full mb-2" />
											<div className="h-2 w-12 bg-neutral-800 rounded-full" />
										</div>
									</div>
								))}
							</div>
						</SpotlightCard>

						{/* Small Card 1 */}
						<SpotlightCard className="p-8">
							<Zap className="h-8 w-8 text-yellow-400 mb-4" />
							<h3 className="text-lg font-semibold text-white mb-2">
								Instant Booking
							</h3>
							<p className="text-neutral-400 text-sm">
								No waiting for quotes. Pricing is algorithmic and upfront.
							</p>
						</SpotlightCard>

						{/* Small Card 2 */}
						<SpotlightCard className="p-8">
							<Building2 className="h-8 w-8 text-pink-400 mb-4" />
							<h3 className="text-lg font-semibold text-white mb-2">
								Verified Pros
							</h3>
							<p className="text-neutral-400 text-sm">
								Background checks and insurance verification included.
							</p>
						</SpotlightCard>
					</div>
				</div>
			</section>

			{/* METRICS / SOCIAL PROOF */}
			<section className="py-24 border-y border-white/5 bg-neutral-900/30">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
						{[
							{ label: "Bookings", value: "10k+" },
							{ label: "Providers", value: "500+" },
							{ label: "Cities", value: "42" },
							{ label: "Rating", value: "4.9/5" },
						].map((stat, i) => (
							<div key={i}>
								<div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tighter">
									{stat.value}
								</div>
								<div className="text-neutral-500 font-medium">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA SECTION */}
			<section className="py-32 px-6 relative overflow-hidden">
				<div className="absolute inset-0 bg-blue-600/5" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full" />

				<div className="max-w-4xl mx-auto text-center relative z-10">
					<h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
						Ready to upgrade?
					</h2>
					<p className="text-xl text-neutral-400 max-w-xl mx-auto mb-12">
						Join thousands of homeowners switching to the modern way of managing
						local services.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							asChild
							variant="glow"
							className="h-14 px-10 text-lg rounded-full w-full sm:w-auto"
						>
							<Link href="/auth/register" className="flex items-center gap-2">
								<span>Get Started Now</span>
								<ChevronRight className="h-5 w-5" />
							</Link>
						</Button>
						<div className="flex items-center gap-4 text-sm text-neutral-400 mt-4 sm:mt-0 px-6">
							<div className="flex -space-x-2">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="h-8 w-8 rounded-full bg-neutral-800 border border-black ring-2 ring-black"
									/>
								))}
							</div>
							<div className="flex flex-col text-left leading-tight">
								<span className="text-white font-semibold">Join 2,000+</span>
								<span className="text-xs">neighbors today</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FOOTER */}
			<footer className="bg-black py-16 px-6 border-t border-white/10">
				<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
					<div className="col-span-2 lg:col-span-2">
						<Link href="/" className="flex items-center gap-2 mb-6">
							<div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
								<MapPin className="h-3 w-3 text-white" />
							</div>
							<span className="font-bold text-lg text-white">GeoServ</span>
						</Link>
						<p className="text-neutral-500 text-sm max-w-xs mb-6">
							The modern standard for local service scheduling. Built for the
							future of work.
						</p>
						<div className="flex gap-4">
							{/* Social placeholders */}
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-8 w-8 bg-neutral-900 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
								>
									<div className="h-4 w-4 bg-neutral-600 rounded-sm" />
								</div>
							))}
						</div>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Product</h4>
						<ul className="space-y-3 text-sm text-neutral-500">
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Features
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Pricing
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Enterprise
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Changelog
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Company</h4>
						<ul className="space-y-3 text-sm text-neutral-500">
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									About
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Careers
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Blog
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Contact
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Legal</h4>
						<ul className="space-y-3 text-sm text-neutral-500">
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Privacy
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Terms
								</Link>
							</li>
							<li>
								<Link href="#" className="hover:text-white transition-colors">
									Security
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-neutral-600 text-sm">
						© {new Date().getFullYear()} GeoServ Inc. All Rights Reserved.
					</div>
					<div className="flex items-center gap-2 text-xs text-neutral-600">
						<div className="h-2 w-2 rounded-full bg-green-500"></div>
						<span>All systems operational</span>
					</div>
				</div>
			</footer>

			{/* CSS for marquee animation */}
			<style jsx global>{`
				@keyframes marquee {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-50%);
					}
				}
				.animate-marquee {
					animation: marquee 30s linear infinite;
				}
			`}</style>
		</div>
	);
}
