import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export const metadata: Metadata = {
	title: "GeoServ",
	description: "Smart booking for service businesses",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const isEmbed = pathname.startsWith("/embed");

	return (
		<html lang="en">
			<body className="bg-gray-50 text-gray-900">
				{!isEmbed && <Navbar />}

				<main
					className={
						isEmbed
							? "min-h-screen bg-white"
							: "min-h-screen container mx-auto px-4"
					}
				>
					{children}
				</main>

				{!isEmbed && <Footer />}
				<Toaster richColors position="top-center" />
			</body>
		</html>
	);
}
