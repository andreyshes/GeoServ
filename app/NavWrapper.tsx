"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { usePathname } from "next/navigation";

export default function NavWrapper({
	children,
	user,
}: {
	children: React.ReactNode;
	user: any;
}) {
	const pathname = usePathname();
	const isEmbed = pathname.startsWith("/embed");

	return (
		<>
			{!isEmbed && <Navbar user={user} />}
			<main
				className={
					isEmbed
						? "min-h-screen flex items-center justify-center bg-white"
						: "min-h-screen container mx-auto px-4"
				}
			>
				{children}
			</main>
		</>
	);
}
