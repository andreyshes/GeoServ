import { db } from "@/lib/db";

jest.mock("@/lib/emails", () => ({
	sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
}));

const mockedDb = db as unknown as {
	booking: { update: jest.Mock };
};

const mockConstructEvent = jest.fn();
const mockRetrieveIntent = jest.fn();

jest.mock("stripe", () => {
	const StripeMock = jest.fn().mockImplementation(() => ({
		webhooks: { constructEvent: mockConstructEvent },
		paymentIntents: { retrieve: mockRetrieveIntent },
	}));

	return { __esModule: true, default: StripeMock };
});

describe("POST /api/stripe/webhook", () => {
	let handler: (req: Request) => Promise<Response>;

	beforeEach(async () => {
		jest.resetModules();
		jest.clearAllMocks();
		mockConstructEvent.mockReset();
		mockRetrieveIntent.mockReset();
		process.env.STRIPE_SECRET_KEY = "sk_test";
		process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
		({ POST: handler } = await import("@/app/api/stripe/webhook/route"));
	});

	it("marks the booking as paid when checkout session completes", async () => {
		const bookingId = "booking-123";
		const req = new Request("http://localhost/api/stripe/webhook", {
			method: "POST",
			headers: { "stripe-signature": "sig" },
			body: "{}",
		});

		const session = {
			metadata: { bookingId },
			payment_intent: "pi_456",
		} as any;

		mockConstructEvent.mockReturnValue({
			type: "checkout.session.completed",
			data: { object: session },
		});

		mockRetrieveIntent.mockResolvedValue({
			latest_charge: { receipt_url: "https://receipt" },
		});

		mockedDb.booking.update.mockResolvedValue({
			id: bookingId,
			serviceType: "Site Survey",
			slot: "10-12",
			date: new Date("2025-01-01T10:00:00Z"),
			customer: { email: "guest@example.com", firstName: "Guest" },
			company: { name: "GeoServe" },
		});

		const response = await handler(req);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({ received: true });
		expect(mockedDb.booking.update).toHaveBeenCalledWith({
			where: { id: bookingId },
			data: {
				paid: true,
				paymentReceiptUrl: "https://receipt",
			},
			include: { customer: true, company: true },
		});
	});

	it("skips database updates when no bookingId is present", async () => {
		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		const req = new Request("http://localhost/api/stripe/webhook", {
			method: "POST",
			headers: { "stripe-signature": "sig" },
			body: "{}",
		});

		mockConstructEvent.mockReturnValue({
			type: "checkout.session.completed",
			data: { object: { metadata: undefined } },
		});

		mockRetrieveIntent.mockResolvedValue({ latest_charge: { receipt_url: undefined } });

		const response = await handler(req);
		await response.json();

		expect(mockedDb.booking.update).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("returns 400 when signature verification fails", async () => {
		const req = new Request("http://localhost/api/stripe/webhook", {
			method: "POST",
			headers: { "stripe-signature": "sig" },
			body: "{}",
		});

		mockConstructEvent.mockImplementation(() => {
			throw new Error("bad signature");
		});

		const response = await handler(req);
		const data = await response.text();
		expect(response.status).toBe(400);
		expect(data).toContain("Webhook Error: bad signature");
	});
});
