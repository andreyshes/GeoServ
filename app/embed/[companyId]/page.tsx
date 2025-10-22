import BookingFlow from "@/app/components/BookingFlow";

export default function EmbedBookingPage({
	params,
}: {
	params: { companyId: string };
}) {
	return (
		<div className="min-h-screen bg-white flex justify-center items-center p-4">
			<BookingFlow companyId={params.companyId} />
		</div>
	);
}
