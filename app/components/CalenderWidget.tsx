export default function CalendarWidget({
	slots,
	onSelect,
}: {
	slots: string[];
	onSelect: (slot: string) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{slots.map((slot) => (
				<button
					key={slot}
					onClick={() => onSelect(slot)}
					className="px-4 py-2 border rounded hover:bg-blue-50"
				>
					{slot}
				</button>
			))}
		</div>
	);
}
