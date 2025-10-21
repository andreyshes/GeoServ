export function generateAvailability(days = 14) {
	const slots = ["9–11 AM", "11–1 PM", "1–3 PM", "3–5 PM"];
	const today = new Date();
	let availability: { day: string; slots: string[] }[] = [];

	for (let i = 0; i < days; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() + i);
		availability.push({
			day: date.toDateString(),
			slots,
		});
	}
	return availability;
}
