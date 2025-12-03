"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
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
import { LogOut } from "lucide-react";

export default function Navbar({ user: serverUser }: { user: any }) {
	const router = useRouter();
	const supabase = createClientComponentClient();

	const [user, setUser] = useState(serverUser);
	useEffect(() => {
		setUser(serverUser);
	}, [serverUser]);

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	async function handleLogout() {
		await supabase.auth.signOut();
		setUser(null);
		router.push("/auth/login");
	}

	const role = user?.user_metadata?.role;

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-neutral-200/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
			<div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
				<Link
					href="/"
					className="text-[1.5rem] font-semibold tracking-tight text-neutral-900 hover:opacity-80 transition-opacity"
				>
					<span className="text-neutral-900">Geo</span>
					<span className="text-neutral-500">Serv</span>
				</Link>

				<div className="flex items-center gap-3">
					{(role === "company" || role === "ADMIN") && (
						<Button
							asChild
							className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white"
						>
							<Link href="/dashboard">Dashboard</Link>
						</Button>
					)}

					{!user ? (
						<div className="flex items-center gap-3 ml-auto">
							<Button
								asChild
								className="rounded-lg bg-gray-600 hover:bg-gray-400 text-white px-5 py-2"
							>
								<Link href="/auth/register">Get Started</Link>
							</Button>

							<Button
								asChild
								variant="outline"
								className="rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
							>
								<Link href="/auth/login">Login</Link>
							</Button>
						</div>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="flex items-center gap-3 hover:bg-neutral-100 px-3 py-2 rounded-xl transition">
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={user.user_metadata?.avatar_url || ""}
											alt={user.user_metadata?.name || "User"}
										/>
										<AvatarFallback>
											{user.email?.[0]?.toUpperCase() || "U"}
										</AvatarFallback>
									</Avatar>
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								align="end"
								className="w-56 bg-white border border-neutral-200 rounded-xl shadow-lg"
							>
								<DropdownMenuLabel className="text-sm text-neutral-500">
									Signed in as
									<br />
									<span className="text-neutral-900 font-medium">
										{user.email}
									</span>
								</DropdownMenuLabel>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={handleLogout}
									className="cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50"
								>
									<LogOut className="h-4 w-4" /> Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</nav>
	);
}
