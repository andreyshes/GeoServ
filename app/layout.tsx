import "./globals.css";
import { Toaster } from "sonner";
import NavWrapper from "@/app/NavWrapper";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Script from "next/script";

export const metadata = {
	title: "GeoServ",
	description: "Smart booking for service businesses",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieStore = cookies();

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				async get(name) {	
					return (await cookieStore).get(name)?.value;
				},
			},
		}
	);

	// ⭐ Fetch the user on the server BEFORE rendering
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<html lang="en">
			<head>
				<Script
					src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
					strategy="beforeInteractive"
				/>
			</head>

			<body className="antialiased">
				<NavWrapper user={user}>
					{children}
					<Toaster richColors position="top-center" />
				</NavWrapper>
			</body>
		</html>
	);
}
