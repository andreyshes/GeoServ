"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

const CompanyContext = createContext<string | null>(null);

export const useCompanyId = () => useContext(CompanyContext);

export default function CompanyProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useSearchParams();
	const companyId = params.get("companyId");

	return (
		<CompanyContext.Provider value={companyId}>
			{children}
		</CompanyContext.Provider>
	);
}
