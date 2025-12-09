"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
	MapPin,
	Menu,
	X,
	LogOut,
	LayoutDashboard,
	User as UserIcon,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

function cn(...inputs: any[]) {
	return twMerge(clsx(inputs));
}

export default function Navbar({ user: initialUser }: { user: any }) {
	const router = useRouter();
	const supabase = supabaseBrowser();

	const [user, setUser] = useState(initialUser);
	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


	useEffect(() => {
		setUser(initialUser);
	}, [initialUser]);


	useEffect(() => {
		const { data } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (_event === "SIGNED_OUT") router.replace("/auth/login");
		});

		return () => data.subscription.unsubscribe();
	}, [supabase, router]);


	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);


	async function handleLogout() {
		await supabase.auth.signOut();
		setUser(null);
		router.replace("/auth/login");
	}

	const role = user?.user_metadata?.role;
	const avatarUrl = user?.user_metadata?.avatar_url;
	const initials = user?.email?.[0]?.toUpperCase() || "U";

	return (
		<>
			<header
				className={cn(
					"fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
					isScrolled
						? "bg-black/50 backdrop-blur-xl border-white/5 py-3"
						: "bg-transparent border-transparent py-6"
				)}
			>
				<div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

					<Link href="/" className="flex items-center gap-2 group">
						<div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
							<MapPin className="h-4 w-4 text-white" />
						</div>
						<span className="font-bold text-lg tracking-tight text-white">
							GeoServ
						</span>
					</Link>


					<nav className="hidden md:flex items-center gap-8">
						<Link
							href="/business"
							className="text-sm font-medium text-neutral-400 hover:text-black  transition-colors dark:hover:text-white"
						>
							For Business
						</Link>
					</nav>


					<div className="hidden md:flex items-center gap-4">
						{role === "company" || role === "ADMIN" ? (
							<Link
								href="/dashboard"
								className="text-sm font-medium text-neutral-400 hover:text-black transition-colors mr-2"
							>
								Dashboard
							</Link>
						) : null}

						{/* Not Logged In */}
						{!user ? (
							<>
								<Link
									href="/auth/login"
									className="text-sm font-medium text-white hover:text-neutral-300 transition-colors"
								>
									Log in
								</Link>
								<Link
									href="/auth/register"
									className="bg-white text-black px-4 py-2 rounded-full text-xs font-medium hover:bg-neutral-200 transition"
								>
									Get Started
								</Link>
							</>
						) : (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="relative h-10 w-10 rounded-full border border-white/10 hover:border-white/30 transition-colors overflow-hidden">
										<Avatar className="h-full w-full">
											<AvatarImage src={avatarUrl} alt="User" />
											<AvatarFallback className="bg-neutral-800 text-white">
												{initials}
											</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>

								<DropdownMenuContent
									align="end"
									className="w-56 bg-[#0A0A0A] border border-white/10 text-neutral-200 rounded-xl shadow-2xl p-2 mt-2"
								>
									<DropdownMenuLabel>
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium text-white">My Account</p>
											<p className="text-xs text-neutral-500 truncate">{user.email}</p>
										</div>
									</DropdownMenuLabel>

									<DropdownMenuSeparator className="bg-white/10 my-2" />

									{role === "company" || role === "ADMIN" ? (
										<DropdownMenuItem asChild>
											<Link href="/dashboard" className="flex items-center">
												<LayoutDashboard className="mr-2 h-4 w-4" />
												Dashboard
											</Link>
										</DropdownMenuItem>
									) : null}

									<DropdownMenuItem asChild>
										<Link href="/profile" className="flex items-center">
											<UserIcon className="mr-2 h-4 w-4" />
											Profile
										</Link>
									</DropdownMenuItem>

									<DropdownMenuSeparator className="bg-white/10 my-2" />

									<DropdownMenuItem
										onClick={handleLogout}
										className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg"
									>
										<LogOut className="mr-2 h-4 w-4" />
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{/* MOBILE MENU BUTTON */}
					<button
						className="md:hidden text-white p-2"
						onClick={() => setMobileMenuOpen(true)}
					>
						<Menu className="h-6 w-6" />
					</button>
				</div>
			</header>

			{/* MOBILE MENU */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[60] bg-black p-6 md:hidden flex flex-col"
					>
						{/* HEADER */}
						<div className="flex justify-between items-center mb-10">
							<span className="flex items-center gap-2 font-bold text-xl text-white">
								<div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
									<MapPin className="h-4 w-4 text-white" />
								</div>
								GeoServ
							</span>

							<button
								onClick={() => setMobileMenuOpen(false)}
								className="text-neutral-400 hover:text-white transition-colors"
							>
								<X className="h-8 w-8" />
							</button>
						</div>

						{/* LINKS */}
						<div className="flex flex-col gap-6 text-xl font-medium text-neutral-400">
							<Link
								href="/business"
								onClick={() => setMobileMenuOpen(false)}
								className="text-white"
							>
								For Business
							</Link>

							{user && (role === "company" || role === "ADMIN") && (
								<Link
									href="/dashboard"
									onClick={() => setMobileMenuOpen(false)}
									className="text-blue-400"
								>
									Dashboard
								</Link>
							)}

							<div className="h-px bg-white/10 w-full" />

							{/* AUTH BUTTONS */}
							{!user ? (
								<>
									<Link
										href="/auth/register"
										onClick={() => setMobileMenuOpen(false)}
										className="bg-blue-600 text-white px-6 py-3 rounded-full text-center"
									>
										Get Started
									</Link>

									<Link
										href="/auth/login"
										onClick={() => setMobileMenuOpen(false)}
										className="bg-neutral-900 text-white px-6 py-3 rounded-full text-center border border-white/20"
									>
										Log in
									</Link>
								</>
							) : (
								<>
									<div className="flex items-center gap-3">
										<Avatar className="h-10 w-10 border border-white/10">
											<AvatarImage src={avatarUrl} />
											<AvatarFallback>{initials}</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="text-white">{user.email}</span>
											<span className="text-neutral-500 text-sm">Logged in</span>
										</div>
									</div>

									<button
										onClick={handleLogout}
										className="bg-neutral-900 text-white px-6 py-3 rounded-full border border-white/20 mt-4"
									>
										Log Out
									</button>
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
