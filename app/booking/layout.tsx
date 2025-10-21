"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

const CompanyContext = createContext<string | null>(null);

export const useCompanyId = () => useContext(CompanyContext);

export default function BookingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useSearchParams();
	const companyId = params.get("companyId");

	return (
		<CompanyContext.Provider value={companyId}>
			<div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
				<main className="flex-1 flex justify-center items-center px-4 py-12">
					<div className="w-full max-w-3xl">{children}</div>
				</main>
			</div>
		</CompanyContext.Provider>
	);
}
