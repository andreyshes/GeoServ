"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ShieldCheck, MapPin, Building2, Briefcase } from "lucide-react";

export default function HomePage() {
	return (
		<section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-[#f9f9f9] via-[#f8f8f8] to-[#efefef] text-neutral-900">
			<div className="absolute -top-40 left-1/4 w-[40rem] h-[40rem] bg-neutral-300/20 rounded-full blur-[10rem]" />
			<div className="absolute bottom-[-20rem] right-1/4 w-[40rem] h-[40rem] bg-neutral-400/20 rounded-full blur-[10rem]" />

			<div className="relative z-10 mt-32 text-center max-w-4xl px-4">
				<h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-neutral-900">
					Book Services.
					<br />
					<span className="text-neutral-600 font-light">
						Smart. Seamless. Local.
					</span>
				</h1>

				<p className="mt-6 text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
					GeoServe helps home and business owners schedule trusted local
					services with ease — powered by real-time address validation and smart
					scheduling.
				</p>

				<div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
					<Button
						asChild
						size="lg"
						className="rounded-lg px-10 py-5 text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-transform hover:scale-[1.02]"
					>
						<Link href="/booking/address">Book a Service</Link>
					</Button>

					<Button
						asChild
						size="lg"
						variant="outline"
						className="rounded-lg px-10 py-5 text-base font-semibold border-neutral-300 text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 flex items-center gap-2"
					>
						<Link href="/auth/register">
							<Briefcase className="h-4 w-4" />
							For Businesses
						</Link>
					</Button>
				</div>

				<p className="mt-4 text-sm text-neutral-500">
					Empowering service providers to manage bookings effortlessly.
				</p>
			</div>

			<div className="mt-24 flex flex-wrap justify-center gap-6 text-neutral-700">
				{[
					{
						icon: Building2,
						text: "Trusted by 200+ local service providers",
					},
					{
						icon: ShieldCheck,
						text: "Protected by enterprise-grade Stripe security",
					},
					{
						icon: MapPin,
						text: "Optimized with real-time geolocation",
					},
				].map(({ icon: Icon, text }, i) => (
					<div
						key={i}
						className="flex items-center gap-3 rounded-full bg-white/80 backdrop-blur-md px-5 py-2 shadow-sm border border-neutral-200 hover:shadow-md transition-all"
					>
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
							<Icon className="h-4 w-4 text-neutral-700" />
						</div>
						<span className="text-sm font-medium">{text}</span>
					</div>
				))}
			</div>

			<div className="absolute bottom-0 w-full h-[140px] bg-gradient-to-t from-neutral-100 to-transparent pointer-events-none" />
		</section>
	);
}
