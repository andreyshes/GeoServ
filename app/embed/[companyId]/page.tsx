import BookingFlow from "@/app/components/BookingFlow";
import CompanyProvider from "@/app/booking/CompanyProvider";

export default function EmbedBookingPage({
	params,
}: {
	params: { companyId: string };
}) {
	return (
		<div className="min-h-screen flex justify-center items-center bg-white p-4">
			<CompanyProvider companyId={params.companyId}>
				<div className="w-full max-w-3xl">
					<BookingFlow companyId={params.companyId} />
				</div>
			</CompanyProvider>
		</div>
	);
}
