"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CalendarRedirectPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryString = searchParams.toString();

	useEffect(() => {
		const target = queryString
			? `/booking/availability?${queryString}`
			: "/booking/availability";
		router.replace(target);
	}, [router, queryString]);

	return (
		<div className="flex items-center justify-center min-h-[60vh] text-gray-500">
			Redirecting to the latest scheduling experience...
		</div>
	);
}
