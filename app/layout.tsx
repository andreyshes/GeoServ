import "./globals.css";
import { Toaster } from "sonner";
import NavWrapper from "@/app/NavWrapper";
import Script from "next/script";

export const metadata = {
	title: "GeoServ",
	description: "Smart booking for service businesses",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<Script
					src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
					strategy="beforeInteractive"
				/>
			</head>
			<body className="bg-gray-50 text-gray-900">
				<NavWrapper>
					{children}
					<Toaster richColors position="top-center" />
				</NavWrapper>
			</body>
		</html>
	);
}
