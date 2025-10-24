"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

const CompanyContext = createContext<string | null>(null);

export const useCompanyId = () => useContext(CompanyContext);

interface CompanyProviderProps {
	children: React.ReactNode;
	companyId?: string;
}

export default function CompanyProvider({
	children,
	companyId,
}: CompanyProviderProps) {
	const params = useSearchParams();
	const paramCompanyId = params.get("companyId");
	const value = companyId || paramCompanyId;

	return (
		<CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
	);
}
