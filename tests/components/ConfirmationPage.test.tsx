import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationPage from "@/app/booking/confirmation/page";

const mockPush = jest.fn();
let mockParams: Record<string, string | null> = {};

jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => ({
		get: (key: string) => mockParams[key] ?? null,
	}),
}));

jest.mock("@/app/booking/layout", () => ({
	useCompanyId: jest.fn(() => "company-9"),
}));

describe("ConfirmationPage", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		jest.clearAllMocks();
		mockPush.mockReset();
		mockParams = { bookingId: "booking-42", paid: "true" };
		global.fetch = jest.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it("renders booking details once loaded", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				id: "booking-42",
				serviceType: "Site Survey",
				date: "2025-07-04T15:00:00.000Z",
				slot: "3–5 PM",
				paid: true,
				company: { name: "GeoServe" },
				customer: { email: "client@example.com" },
				paymentReceiptUrl: "https://receipt.example.com",
			}),
		});

		render(<ConfirmationPage />);

		expect(await screen.findByText(/Booking Confirmed!/i)).toBeInTheDocument();
		expect(screen.getByText(/Site Survey/)).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /View Payment Receipt/i })
		).toHaveAttribute("href", "https://receipt.example.com");
	});

	it("shows the empty state when booking cannot be resolved", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			json: async () => null,
		});

		render(<ConfirmationPage />);

		expect(await screen.findByText(/Booking not found/i)).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: /Back to Home/i })
		);
		expect(mockPush).toHaveBeenCalled();
	});

	it("requests bookingId from session when missing and stops loading", async () => {
		mockParams = { session_id: "cs_test" };
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: "session-booking" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: "session-booking",
					serviceType: "Consultation",
					date: "2025-08-10T12:00:00.000Z",
					slot: "10–12",
					paid: false,
					company: { name: "GeoServe" },
					customer: { email: "session@example.com" },
				}),
			});

		render(<ConfirmationPage />);

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
		expect(await screen.findByText(/Consultation/)).toBeInTheDocument();
	});
});
