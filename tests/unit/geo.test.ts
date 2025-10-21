import { getCoordinates } from "@/lib/geo";

const originalFetch = global.fetch;
const originalEnvKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

describe("getCoordinates", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
		global.fetch = jest.fn();
	});

	afterEach(() => {
		jest.resetAllMocks();
		process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnvKey;
		global.fetch = originalFetch;
	});

	it("returns lat/lng when Google responds with OK", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => ({
				status: "OK",
				results: [
					{ geometry: { location: { lat: 37.422, lng: -122.084 } } },
				],
			}),
		});

		const result = await getCoordinates("1600 Amphitheatre Parkway");

		expect(global.fetch).toHaveBeenCalledWith(
			"https://maps.googleapis.com/maps/api/geocode/json?address=1600%20Amphitheatre%20Parkway&key=test-key"
		);
		expect(result).toEqual({ lat: 37.422, lng: -122.084 });
	});

	it("returns null when Google indicates no results", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => ({ status: "ZERO_RESULTS", results: [] }),
		});

		expect(await getCoordinates("unknown place")).toBeNull();
	});

	it("returns null when the request throws", async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error("network"));

		await expect(getCoordinates("error")).resolves.toBeNull();
	});
});
