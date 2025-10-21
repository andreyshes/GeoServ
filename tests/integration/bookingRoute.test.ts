import { POST as createBooking } from "@/app/api/booking/route";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/notifications";

jest.mock("@/lib/notifications", () => ({
	sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockedDb = db as unknown as {
	service: { findFirst: jest.Mock };
	booking: { create: jest.Mock };
};

describe("POST /api/booking", () => {
	const payload = {
		firstName: "Grace",
		lastName: "Hopper",
		phone: "555-0101",
		email: "grace@example.com",
		serviceType: "GIS Survey",
		slot: "8–10",
		date: "2025-06-01T08:00:00.000Z",
		companyId: "comp-1",
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockedDb.service.findFirst.mockResolvedValue({ priceCents: 4200 });
		mockedDb.booking.create.mockResolvedValue({
			id: "booking-42",
			serviceType: payload.serviceType,
			date: payload.date,
			slot: payload.slot,
			amountCents: 4200,
			paid: false,
			company: { id: payload.companyId, name: "GeoServe" },
			customer: {
				firstName: payload.firstName,
				lastName: payload.lastName,
				email: payload.email,
			},
		});
	});

	function buildRequest(body = payload) {
		return new Request("http://localhost/api/booking", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
	}

	it("persists the booking and sends a confirmation email", async () => {
		const response = await createBooking(buildRequest());
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.booking.id).toBe("booking-42");
		expect(mockedDb.booking.create).toHaveBeenCalledTimes(1);
		expect(sendConfirmationEmail).toHaveBeenCalledWith({
			to: payload.email,
			name: payload.firstName,
			ref: "booking-42",
			service: payload.serviceType,
			date: payload.date,
			slot: payload.slot,
		});
	});

	it("returns 400 when booking creation fails", async () => {
		mockedDb.booking.create.mockRejectedValueOnce(new Error("db down"));

		const response = await createBooking(buildRequest());
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain("db down");
		expect(sendConfirmationEmail).not.toHaveBeenCalled();
	});
});
