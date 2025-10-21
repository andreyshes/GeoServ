import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const input = searchParams.get("input");

	if (!input) {
		return NextResponse.json({ predictions: [] });
	}

	try {
		const res = await fetch(
			`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
				input
			)}&key=${process.env.GOOGLE_MAPS_API_KEY}`, // notice: server-side key, not NEXT_PUBLIC
			{ cache: "no-store" }
		);

		const data = await res.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ predictions: [] }, { status: 500 });
	}
}
