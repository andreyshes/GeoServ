"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import GeolocationCard from "./components/GeolocationCard";
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
} from "lucide-react";

const Button = ({
	children,
	variant = "primary",
	className = "",
	icon: Icon,
	asChild = false,
	...props
}: {
	children: React.ReactNode;
	variant?: "primary" | "secondary" | "glow";
	className?: string;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	onClick?: () => void;
	asChild?: boolean;
}) => {
	const base =
		"group inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";

	const variants = {
		primary: "bg-white text-black hover:bg-neutral-200",
		secondary:
			"bg-neutral-900 text-white border border-white/10 hover:bg-neutral-800",
		glow: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]",
	};
	const Component: any = asChild ? "span" : "button";

	return (
		<Component
			className={`${base} ${variants[variant]} ${className}`}
			{...props}
		>
			{children}
			{Icon && (
				<Icon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
			)}
		</Component>
	);
};

const Card = ({
	title,
	description,
	icon: Icon,
}: {
	title: string;
	description: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => (
	<div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-8 transition-all hover:bg-neutral-900/80">
		<div className="absolute -top-28 -right-28 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
		<div className="relative z-10">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 border border-white/5 text-blue-400">
				<Icon className="h-6 w-6" />
			</div>
			<h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
			<p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
		</div>
	</div>
);

export default function HomePage() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div className="min-h-screen bg-[#030303] text-neutral-200 font-sans overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
			{/* Background */}
			<div className="fixed inset-0 pointer-events-none -z-10">
				<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
				<div className="absolute left-1/2 top-0 w-[300px] h-[300px] -translate-x-1/2 bg-blue-500/20 blur-[120px]" />
				<div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[120px]" />
			</div>

			{/* MOBILE MENU */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden">
					<div className="flex flex-col gap-6 text-xl text-neutral-400">
						<Link href="/features" className="text-white">
							Features
						</Link>
						<Link href="/auth/register" className="text-white">
							For Business
						</Link>
						<Link href="/pricing" className="text-white">
							Pricing
						</Link>
						<Link href="/auth/login" className="text-white">
							Login
						</Link>

						<Button asChild variant="glow" className="w-full">
							<Link href="/find-provider">Get Started</Link>
						</Button>
					</div>
				</div>
			)}

			{/* HERO */}
			<section className="pt-36 pb-24 md:pt-48 md:pb-32 px-6 text-center">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-8 leading-[1.1] max-w-4xl mx-auto">
						Local services.
						<br />
						Smart. Seamless. Secure.
					</h1>

					<p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12">
						The operating system for local scheduling — connecting homeowners
						with trusted providers through real-time address validation.
					</p>

					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Button
							asChild
							variant="secondary"
							icon={Briefcase}
							className="px-8 py-4 text-base"
						>
							<Link href="/auth/register">For Business</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* FEATURES */}
			<section className="py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
						Built for speed.
						<br />
						Designed for trust.
					</h2>

					<p className="text-neutral-400 max-w-xl text-lg mb-16">
						We’ve re-engineered the booking process from the ground up —
						replacing quote calls with clean, reliable software.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Geolocation Card */}
						<GeolocationCard className="md:col-span-2" />

						{/* Stripe Card */}
						<div className="rounded-3xl border border-white/10 bg-neutral-900/50 p-10 hover:border-white/20 transition-all">
							<div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
								<ShieldCheck className="h-6 w-6" />
							</div>

							<h3 className="text-xl font-bold text-white mb-3">
								Stripe Security
							</h3>

							<p className="text-neutral-400 text-sm mb-6">
								Enterprise-grade payment protection with dispute handling and
								secure escrow.
							</p>

							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
									>
										<div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center">
											<CheckCircle2 className="h-4 w-4 text-green-500" />
										</div>

										<div className="h-2 w-20 bg-neutral-800 rounded-full" />
									</div>
								))}
							</div>
						</div>

						{/* Small Cards */}
						<Card
							title="Verified Providers"
							description="Every provider passes a 7-step background & quality check."
							icon={Building2}
						/>
						<Card
							title="Instant Booking"
							description="Choose a time, confirm, done. No quotes, no callbacks."
							icon={Zap}
						/>
						<Card
							title="24/7 Support"
							description="Our support team is ready at any hour."
							icon={Clock}
						/>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-32 px-6 bg-blue-600/5">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
						Ready to upgrade your <br /> service experience?
					</h2>

					<p className="text-neutral-400 max-w-xl mx-auto text-lg mb-10">
						Join thousands of homeowners switching to the modern way of managing
						local services.
					</p>

					<Button
						asChild
						variant="primary"
						className="h-14 px-8 text-lg rounded-full "
					>
						<Link href="/auth/register" className="flex items-center gap-2">
							<span>Get Started</span>
							<ChevronRight className="h-5 w-5" />
						</Link>
					</Button>
				</div>
			</section>

			{/* FOOTER */}
			<footer className="border-t border-white/10 bg-black py-12 px-6">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex items-center gap-2">
						<div className="h-6 w-6 bg-neutral-800 rounded flex items-center justify-center">
							<MapPin className="h-3 w-3 text-white" />
						</div>

						<span className="text-sm font-semibold text-white">
							GeoServ Inc.
						</span>
					</div>

					<div className="text-neutral-500 text-sm">
						© {new Date().getFullYear()} GeoServ. All Rights Reserved.
					</div>
				</div>
			</footer>
		</div>
	);
}
