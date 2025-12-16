import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse } from "@/lib/type";

const QuerySchema = z.object({
	input: z.string().min(1, "Input must not be empty"),
});

const PredictionSchema = z.object({
	description: z.string(),
	place_id: z.string(),
});
const PredictionsArray = z.array(PredictionSchema);

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const parsed = QuerySchema.safeParse({
			input: searchParams.get("input"),
		});

		if (!parsed.success) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "Invalid query parameters",
				},
				{ status: 400 }
			);
		}

		const { input } = parsed.data;

		if (!process.env.GOOGLE_MAPS_API_KEY) {
			throw new Error("Missing GOOGLE_MAPS_API_KEY");
		}

		const res = await fetch(
			`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
				input
			)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
			{ cache: "no-store" }
		);

		if (!res.ok) {
			throw new Error("Failed to fetch data from Google Places");
		}

		const json = await res.json();

		const predictions = PredictionsArray.safeParse(json.predictions ?? []);

		if (!predictions.success) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "Google returned an invalid response structure",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json<ApiResponse<typeof predictions.data>>({
			success: true,
			data: predictions.data,
		});
	} catch (err) {
		console.error("❌ Autocomplete error:", err);
		if (err instanceof z.ZodError) {
			return NextResponse.json<ApiResponse<null>>(
				{
					success: false,
					error: "Invalid request data",
				},
				{
					status: 400,
				}
			);
		}

		return NextResponse.json<ApiResponse<null>>(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
