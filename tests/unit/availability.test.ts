import { generateAvailability } from "@/lib/calendar";

describe("generateAvailability", () => {
	const now = new Date("2025-01-01T10:30:00Z");

	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it("returns 14 days by default with the predefined slots", () => {
		const availability = generateAvailability();

		expect(availability).toHaveLength(14);
		expect(availability[0].day).toBe(now.toDateString());
		expect(availability[0].slots).toEqual([
			"9–11 AM",
			"11–1 PM",
			"1–3 PM",
			"3–5 PM",
		]);
	});

	it("reuses the same slot reference for every generated day", () => {
		const availability = generateAvailability(5);
		const uniqueSlotArrays = new Set(availability.map((entry) => entry.slots));
		expect(uniqueSlotArrays.size).toBe(1);
	});

	it("respects a custom day window", () => {
		const availability = generateAvailability(3);
		const expectedDates = Array.from({ length: 3 }, (_, index) => {
			const date = new Date(now);
			date.setDate(now.getDate() + index);
			return date.toDateString();
		});

		expect(availability.map((entry) => entry.day)).toEqual(expectedDates);
	});
});
