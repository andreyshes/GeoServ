"use client";

import AddressPage from "@/app/booking/address/page";
import SchedulePage from "@/app/booking/availability/page";
import DetailsPage from "@/app/booking/details/page";
import PaymentPage from "@/app/booking/payment/page";
import ConfirmationPage from "@/app/booking/confirmation/page";
import { usePathname, useSearchParams } from "next/navigation";

export default function BookingFlow({ companyId }: { companyId: string }) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const stepParam = searchParams.get("step") || "address";
	const step = (() => {
		switch (stepParam) {
			case "availability":
			case "calendar":
			case "schedule":
				return "schedule";
			case "details":
			case "payment":
			case "confirmation":
				return stepParam;
			default:
				return "address";
		}
	})();
	const isEmbed = pathname.startsWith("/embed");

	const renderStep = () => {
		switch (step) {
			case "address":
				return <AddressPage companyId={companyId} embedded={isEmbed} />;
			case "schedule":
				return <SchedulePage
					companyId={companyId}
					embedded={isEmbed}
				/>;
			case "details":
				return <DetailsPage companyId={companyId} embedded={isEmbed} />;
			case "payment":
				return <PaymentPage companyId={companyId} embedded={isEmbed} />;
			case "confirmation":
				return <ConfirmationPage
					companyId={companyId}
					embedded={isEmbed}
				/>;
			default:
				return <AddressPage companyId={companyId} embedded={isEmbed} />;
		}
	};

	return (
		<div className="w-full max-w-3xl mx-auto bg-white">{renderStep()}</div>
	);
}
