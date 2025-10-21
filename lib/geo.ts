export async function getCoordinates(address: string) {
	try {
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
		const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
			address
		)}&key=${apiKey}`;
		const res = await fetch(url);
		const data = await res.json();

		if (data.status !== "OK" || !data.results[0]) return null;

		const { lat, lng } = data.results[0].geometry.location;
		return { lat, lng };
	} catch (err) {
		console.error("Geocode error:", err);
		return null;
	}
}
