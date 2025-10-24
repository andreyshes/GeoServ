"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function NavWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isEmbed = pathname.startsWith("/embed");

	return (
		<>
			{!isEmbed && <Navbar />}
			<main
				className={
					isEmbed
						? "min-h-screen flex justify-center items-center bg-white"
						: "min-h-screen container mx-auto px-4"
				}
			>
				{children}
			</main>
			{!isEmbed && <Footer />}
		</>
	);
}
