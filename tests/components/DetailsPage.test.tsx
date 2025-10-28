import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DetailsPage from "@/app/booking/details/page";

const mockPush = jest.fn();
let mockParams: Record<string, string | null> = {};

jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => ({
		get: (key: string) => mockParams[key] ?? null,
	}),
}));

jest.mock("@/app/booking/layout", () => ({
	useCompanyId: jest.fn(() => "company-xyz"),
}));

jest.mock("@/app/components/BookingProgress", () => () => (
	<div data-testid="booking-progress" />
));

jest.mock("@/app/components/LocalTime", () => ({
	LocalTimeDisplay: ({
		day,
		slot,
	}: {
		day: string | null;
		slot: string | null;
	}) => <span>{`${day ?? ""} ${slot ?? ""}`.trim()}</span>,
}));

jest.mock("framer-motion", () => ({
	motion: {
		select: ({ children, whileFocus, whileHover, whileTap, ...rest }: any) => (
			<select {...rest}>{children}</select>
		),
		button: ({ children, whileFocus, whileHover, whileTap, ...rest }: any) => (
			<button {...rest}>{children}</button>
		),
	},
}));

describe("DetailsPage", () => {
	const originalFetch = global.fetch;
	const originalSessionStorage = global.sessionStorage;
	let storage: Record<string, string>;

	beforeEach(() => {
		mockParams = { day: "2025-09-15", slot: "9–11 AM" };
		mockPush.mockReset();
		global.fetch = jest.fn();
		storage = {};
		Object.defineProperty(window, "sessionStorage", {
			value: {
				setItem: jest.fn((key: string, value: string) => {
					storage[key] = value;
				}),
				getItem: jest.fn((key: string) => storage[key]),
			},
			configurable: true,
		});
	});

	afterEach(() => {
		global.fetch = originalFetch;
		Object.defineProperty(window, "sessionStorage", {
			value: originalSessionStorage,
			configurable: true,
		});
	});

	it("renders available services fetched for the company", async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				services: [
					{ id: "1", name: "Survey", priceCents: 15000, durationText: "2h" },
					{ id: "2", name: "Survey", priceCents: 15000, durationText: "2h" },
					{ id: "3", name: "Mapping", priceCents: 9000, durationText: "1h" },
				],
			}),
		});

		render(<DetailsPage />);

		expect(
			await screen.findByRole("option", { name: /Survey/i })
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: /Mapping/i })
		).toBeInTheDocument();
		expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
			"/api/company/company-xyz/services"
		);
	});

	it("submits booking details and routes to payment", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					services: [
						{
							id: "svc-1",
							name: "Mapping",
							priceCents: 9000,
							durationText: "60 min",
						},
					],
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					booking: { id: "booking-1" },
				}),
			});

		render(<DetailsPage />);

		const firstNameInput = await screen.findByPlaceholderText("First Name");
		await userEvent.type(firstNameInput, "Jane");
		await userEvent.type(screen.getByPlaceholderText("Last Name"), "Doe");
		await userEvent.type(screen.getByPlaceholderText("Phone"), "5551234");
		await userEvent.type(
			screen.getByPlaceholderText("Email"),
			"jane@example.com"
		);
		await userEvent.selectOptions(screen.getByRole("combobox"), "Mapping");

		await userEvent.click(
			screen.getByRole("button", { name: /Continue to Payment/i })
		);

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

		const [, bookingRequest] = (global.fetch as jest.Mock).mock.calls;
		const requestUrl = bookingRequest[0];
		const requestInit = bookingRequest[1];
		expect(requestUrl).toBe("/api/booking");

		const body = JSON.parse(requestInit.body);
		expect(body).toMatchObject({
			firstName: "Jane",
			serviceType: "Mapping",
			companyId: "company-xyz",
			slot: "9–11 AM",
		});
		expect(body.date).toContain("2025-09-15");
		expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
			"bookingDetails",
			JSON.stringify({ id: "booking-1" })
		);
		expect(mockPush).toHaveBeenCalledWith(
			"/booking/payment?companyId=company-xyz"
		);
	});

	it("shows an error message when loading services fails", async () => {
		(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network"));

		render(<DetailsPage />);

		expect(
			await screen.findByText(/Failed to load services/i)
		).toBeInTheDocument();
	});
});
