"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function ServiceAreaMap() {
	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
	});

	if (!isLoaded) return <div>Loading map...</div>;

	return (
		<GoogleMap
			mapContainerStyle={{ width: "100%", height: "300px" }}
			center={{ lat: 37.7749, lng: -122.4194 }}
			zoom={11}
		>
			<Marker position={{ lat: 37.7749, lng: -122.4194 }} />
		</GoogleMap>
	);
}
