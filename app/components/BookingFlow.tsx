"use client";

import AddressPage from "@/app/booking/address/page";
import AvailabilityPage from "@/app/booking/availability/page";
import CalendarPage from "@/app/booking/calendar/page";
import DetailsPage from "@/app/booking/details/page";
import PaymentPage from "@/app/booking/payment/page";
import ConfirmationPage from "@/app/booking/confirmation/page";
import { useSearchParams } from "next/navigation";



export default function BookingFlow({ companyId }: { companyId: string }) {
	const searchParams = useSearchParams();
	const step = searchParams.get("step") || "address";

	const renderStep = () => {
		switch (step) {
			case "address":
				return <AddressPage companyId={companyId} />;
			case "availability":
				return <AvailabilityPage companyId={companyId} />;
			case "calendar":
				return <CalendarPage companyId={companyId} />;
			case "details":
				return <DetailsPage companyId={companyId} />;
			case "payment":
				return <PaymentPage companyId={companyId} />;
			case "confirmation":
				return <ConfirmationPage companyId={companyId} />;
			default:
				return <AddressPage companyId={companyId} />;
		}
	};

	return (
		<div className="w-full max-w-3xl mx-auto bg-white">{renderStep()}</div>
	);
}
