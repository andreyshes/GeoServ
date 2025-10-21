import Link from "next/link";
import Stepper from "@/app/components/Stepper";

export default function BookingPage() {
	return (
		<div className="max-w-2xl mx-auto mt-12 p-6 bg-white shadow rounded-lg">
			<Stepper step={0} />
			<h1 className="text-3xl font-bold mb-4">Start Your Booking</h1>
			<p className="mb-6 text-gray-600">We’ll guide you step by step.</p>
			<Link
				href="/booking/address"
				className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Begin
			</Link>
		</div>
	);
}
