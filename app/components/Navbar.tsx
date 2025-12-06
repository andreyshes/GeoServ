"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/app/components/ui/avatar";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const CustomButton = React.forwardRef<
	HTMLButtonElement | HTMLAnchorElement,
	any
>(function CustomButton(
	{
		children,
		variant = "primary",
		className = "",
		onClick,
		asChild = false,
		...props
	},
	ref
) {
	const base =
		"group inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-black active:scale-95 cursor-pointer";

	const variants: any = {
		primary:
			"bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5",
		secondary:
			"bg-neutral-900 text-white border border-white/10 hover:bg-neutral-800 hover:border-white/20",
		glow: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] border border-blue-500/20",
		ghost: "text-neutral-400 hover:text-white hover:bg-white/5",
	};

	const combinedClass = cn(base, variants[variant], className);

	if (asChild) {
		return (
			<div
				className={combinedClass}
				onClick={onClick}
				ref={ref as any}
				{...props}
			>
				{children}
			</div>
		);
	}

	return (
		<button
			ref={ref as React.Ref<HTMLButtonElement>}
			onClick={onClick}
			className={combinedClass}
			{...props}
		>
			{children}
		</button>
	);
});

export default function Navbar({ user: serverUser }: { user: any }) {
	const router = useRouter();
	const supabase = createClientComponentClient();

	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [user, setUser] = useState(serverUser);

	useEffect(() => {
		setUser(serverUser);
	}, [serverUser]);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (_event === "SIGNED_OUT") {
				setUser(null);
				router.push("/");
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase, router]);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	async function handleLogout() {
		await supabase.auth.signOut();
		setUser(null); // Optimistic update
		setMobileMenuOpen(false);
		router.push("/auth/login");
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
							className="text-sm font-medium text-neutral-400 hover:text-black transition-colors dark:hover:text-white "
						>
							For Business
						</Link>
					</nav>

					<div className="hidden md:flex items-center gap-4">
						{(role === "company" || role === "ADMIN") && (
							<Link
								href="/dashboard"
								className="text-sm font-medium text-neutral-400 hover:text-black transition-colors dark:hover:text-white mr-2"
							>
								Dashboard
							</Link>
						)}

						{!user ? (
							<>
								<Link
									href="/auth/login"
									className="text-sm font-medium text-white hover:text-neutral-300 transition-colors"
								>
									Log in
								</Link>
								<CustomButton
									asChild
									variant="primary"
									className="h-10 px-5 text-xs"
								>
									<Link href="/auth/register">Get Started</Link>
								</CustomButton>
							</>
						) : (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="relative h-10 w-10 rounded-full border border-white/10 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden">
										<Avatar className="h-full w-full">
											<AvatarImage src={avatarUrl} alt="User" />
											<AvatarFallback className="bg-neutral-800 text-white font-medium">
												{initials}
											</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>

								<DropdownMenuContent
									align="end"
									className="w-56 bg-[#0A0A0A] border border-white/10 text-neutral-200 rounded-xl shadow-2xl shadow-black p-2 mt-2"
								>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none text-white">
												My Account
											</p>
											<p className="text-xs leading-none text-neutral-500 truncate">
												{user.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-white/10 my-2" />

									{(role === "company" || role === "ADMIN") && (
										<DropdownMenuItem
											asChild
											className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg"
										>
											<Link
												href="/dashboard"
												className="flex items-center w-full"
											>
												<LayoutDashboard className="mr-2 h-4 w-4" />
												<span>Dashboard</span>
											</Link>
										</DropdownMenuItem>
									)}

									<DropdownMenuItem
										asChild
										className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg"
									>
										<Link href="/profile" className="flex items-center w-full">
											<User className="mr-2 h-4 w-4" />
											<span>Profile</span>
										</Link>
									</DropdownMenuItem>

									<DropdownMenuSeparator className="bg-white/10 my-2" />

									<DropdownMenuItem
										onClick={handleLogout}
										className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg"
									>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{/* MOBILE MENU TRIGGER */}
					<button
						className="md:hidden text-white p-2"
						onClick={() => setMobileMenuOpen(true)}
					>
						<Menu className="h-6 w-6" />
					</button>
				</div>
			</header>

			{/* MOBILE MENU OVERLAY */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[60] bg-black p-6 md:hidden flex flex-col"
					>
						{/* Header */}
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

						{/* Links */}
						<div className="flex flex-col gap-6 text-xl font-medium text-neutral-400">
							<Link
								href="/business"
								className="text-white  hover:text-black"
								onClick={() => setMobileMenuOpen(false)}
							>
								For Business
							</Link>

							{user && (role === "company" || role === "ADMIN") && (
								<Link
									href="/dashboard"
									className="text-blue-400"
									onClick={() => setMobileMenuOpen(false)}
								>
									Dashboard
								</Link>
							)}

							<div className="h-px bg-white/10 w-full my-4" />

							{/* Auth Buttons Mobile */}
							{!user ? (
								<div className="flex flex-col gap-4">
									<CustomButton
										asChild
										variant="glow"
										className="w-full justify-center text-lg"
									>
										<Link
											href="/auth/register"
											onClick={() => setMobileMenuOpen(false)}
										>
											Get Started
										</Link>
									</CustomButton>
									<CustomButton
										asChild
										variant="secondary"
										className="w-full justify-center text-lg"
									>
										<Link
											href="/auth/login"
											onClick={() => setMobileMenuOpen(false)}
										>
											Log in
										</Link>
									</CustomButton>
								</div>
							) : (
								<div className="flex flex-col gap-4">
									<div className="flex items-center gap-3 mb-4">
										<Avatar className="h-10 w-10 border border-white/10">
											<AvatarImage src={avatarUrl} />
											<AvatarFallback className="bg-neutral-800 text-white">
												{initials}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="text-white text-base">{user.email}</span>
											<span className="text-neutral-500 text-sm">
												Logged in
											</span>
										</div>
									</div>
									<CustomButton
										variant="secondary"
										onClick={handleLogout}
										className="w-full justify-center"
									>
										Log Out
									</CustomButton>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
