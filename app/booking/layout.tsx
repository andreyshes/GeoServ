export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import type { ReactNode } from "react";
import CompanyProvider from "@/app/booking/CompanyProvider";

export default function BookingLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
			<main className="flex-1 flex justify-center items-center px-4 py-12">
				<div className="w-full max-w-3xl">
					<CompanyProvider>{children}</CompanyProvider>
				</div>
			</main>
		</div>
	);
}
