import { POST as createBooking } from "@/app/api/booking/route";
import { db } from "@/lib/db";

jest.mock("@/lib/notifications", () => ({
	sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockedDb = db as unknown as {
	service: { findFirst: jest.Mock };
	booking: { create: jest.Mock };
};

describe("booking pricing", () => {
	const basePayload = {
		firstName: "Ada",
		lastName: "Lovelace",
		phone: "123",
		email: "ada@example.com",
		serviceType: "Site Survey",
		companyId: "company-1",
		slot: "10–12",
		date: "2025-05-01T10:00:00.000Z",
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockedDb.booking.create.mockResolvedValue({
			id: "booking-1",
			...basePayload,
			paid: false,
			company: { id: basePayload.companyId, name: "GeoServ" },
			customer: {
				id: "cust-1",
				email: basePayload.email,
				firstName: basePayload.firstName,
				lastName: basePayload.lastName,
			},
		});
	});

	function makeRequest(payload = basePayload) {
		return new Request("http://localhost/api/booking", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	}

	it("uses the matched service price when available", async () => {
		mockedDb.service.findFirst.mockResolvedValue({ priceCents: 5500 });

		const response = await createBooking(makeRequest());
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(mockedDb.booking.create).toHaveBeenCalledTimes(1);
		expect(mockedDb.booking.create.mock.calls[0][0].data.amountCents).toBe(5500);
	});

	it("falls back to the default price when service is missing", async () => {
		mockedDb.service.findFirst.mockResolvedValue(null);

		const response = await createBooking(makeRequest());

		expect(response.status).toBe(200);
		expect(mockedDb.booking.create.mock.calls[0][0].data.amountCents).toBe(10000);
	});
});
