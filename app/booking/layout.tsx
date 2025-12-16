export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import type { ReactNode } from "react";
import CompanyProvider from "@/app/booking/CompanyProvider";

export default function BookingLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen w-full bg-neutral-950 text-white">
			<CompanyProvider>{children}</CompanyProvider>
		</div>
	);
}
