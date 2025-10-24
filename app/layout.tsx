import "./globals.css";
import { Toaster } from "sonner";
import NavWrapper from "@/app/NavWrapper";
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
			<body className="bg-gray-50 text-gray-900">
				<NavWrapper>
					{children}
					<Toaster richColors position="top-center" />
				</NavWrapper>
			</body>
		</html>
	);
}
