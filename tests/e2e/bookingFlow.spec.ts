import { sendConfirmationEmail } from "@/lib/notifications";

jest.mock("@/lib/notifications", () => ({
	sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockStripe = {
	constructEvent: jest.fn(),
	retrieveIntent: jest.fn(),
};

jest.mock("stripe", () => {
	const StripeMock = jest.fn().mockImplementation(() => ({
		webhooks: { constructEvent: mockStripe.constructEvent },
		paymentIntents: { retrieve: mockStripe.retrieveIntent },
	}));

	return { __esModule: true, default: StripeMock };
});

describe("Booking flow", () => {
	const services = [
		{
			id: "svc-1",
			companyId: "company-1",
			name: "Site Survey",
			priceCents: 19000,
		},
	];
	const companies = {
		"company-1": { id: "company-1", name: "GeoServe", domain: "geoserve.test" },
	};
	let bookings: any[];

	beforeEach(() => {
		bookings = [];
		jest.clearAllMocks();
		mockStripe.constructEvent.mockReset();
		mockStripe.retrieveIntent.mockReset();
		process.env.STRIPE_SECRET_KEY = "sk_test";
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
		process.env.NEXT_PUBLIC_APP_URL = "https://app.geoserve.test";
	});

	it("creates a booking and marks it paid via the webhook", async () => {
		const { db } = await import("@/lib/db");

		(db.service.findFirst as jest.Mock).mockImplementation(
			async ({ where }) =>
				services.find(
					(service) =>
						service.name === where.name && service.companyId === where.companyId
				) || null
		);

		(db.booking.create as jest.Mock).mockImplementation(
			async ({
				data,
			}: {
				data: {
					serviceType: string;
					date: string;
					slot: string;
					status: string;
					paid: boolean;
					amountCents: number;
					company: { connect: { id: keyof typeof companies } };
					customer: {
						connectOrCreate: {
							where: { email: string };
							create: { firstName: string; lastName: string };
						};
					};
				};
			}) => {
				const booking = {
					id: `booking-${bookings.length + 1}`,
					serviceType: data.serviceType,
					date: data.date,
					slot: data.slot,
					status: data.status,
					paid: data.paid,
					amountCents: data.amountCents,
					paymentId: null,
					paymentReceiptUrl: null,
					company: companies[data.company.connect.id],
					customer: {
						id: `cust-${bookings.length + 1}`,
						email: data.customer.connectOrCreate.where.email,
						firstName: data.customer.connectOrCreate.create.firstName,
						lastName: data.customer.connectOrCreate.create.lastName,
					},
				};
				bookings.push(booking);
				return booking;
			}
		);

		(db.booking.findUnique as jest.Mock).mockImplementation(
			async ({ where }) =>
				bookings.find((booking) => booking.id === where.id) || null
		);

		(db.booking.update as jest.Mock).mockImplementation(
			async ({ where, data }) => {
				const booking = bookings.find((item) => item.id === where.id);
				Object.assign(booking, data);
				return booking;
			}
		);

		const bookingModule = await import("@/app/api/booking/route");
		const bookingGetModule = await import("@/app/api/booking/[id]/route");
		const webhookModule = await import("@/app/api/stripe/webhook/route");

		const bookingPayload = {
			firstName: "Nora",
			lastName: "River",
			phone: "555-0011",
			email: "nora@example.com",
			serviceType: "Site Survey",
			companyId: "company-1",
			slot: "8–10",
			date: "2025-09-10T08:00:00.000Z",
		};

		const bookingResponse = await bookingModule.POST(
			new Request("http://localhost/api/booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookingPayload),
			})
		);

		const bookingJson = await bookingResponse.json();
		expect(bookingResponse.status).toBe(200);
		expect(bookingJson.booking.id).toBe("booking-1");
		expect(bookings).toHaveLength(1);
		expect(bookings[0].amountCents).toBe(19000);
		expect(sendConfirmationEmail).toHaveBeenCalledWith({
			to: "nora@example.com",
			name: "Nora",
			ref: "booking-1",
			service: "Site Survey",
			date: "2025-09-10T08:00:00.000Z",
			slot: "8–10",
		});

		const fetchResponse = await bookingGetModule.GET(
			new Request("http://localhost/api/booking/booking-1"),
			{ params: Promise.resolve({ id: "booking-1" }) }
		);

		const fetchedBooking = await fetchResponse.json();
		expect(fetchedBooking.id).toBe("booking-1");
		expect(fetchedBooking.paid).toBe(false);

		mockStripe.constructEvent.mockReturnValue({
			type: "checkout.session.completed",
			data: {
				object: {
					metadata: { bookingId: "booking-1" },
					payment_intent: "pi_789",
				},
			},
		});
		mockStripe.retrieveIntent.mockResolvedValue({
			latest_charge: { receipt_url: "https://receipt.example.com" },
		});

		const webhookResponse = await webhookModule.POST(
			new Request("http://localhost/api/stripe/webhook", {
				method: "POST",
				headers: { "stripe-signature": "sig" },
				body: "{}",
			})
		);

		expect(webhookResponse.status).toBe(200);
		expect(bookings[0].paid).toBe(true);
		expect(bookings[0].paymentId).toBeNull();
		expect(bookings[0].paymentReceiptUrl).toBe("https://receipt.example.com");
	});
});
