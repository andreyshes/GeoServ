"use client";

const steps = [
	{ id: "address", label: "Address" },
	{ id: "schedule", label: "Schedule" },
	{ id: "details", label: "Details" },
	{ id: "payment", label: "Payment" },
	{ id: "confirmation", label: "Confirm" },
] as const;

type StepId = (typeof steps)[number]["id"];

export default function BookingProgress({
	currentStep,
}: {
	currentStep: StepId;
}) {
	const index = steps.findIndex((step) => step.id === currentStep);
	const currentIndex = index === -1 ? 0 : index;
	const progress = ((currentIndex + 1) / steps.length) * 100;

	return (
		<div className="max-w-3xl mx-auto mb-10 px-6">
			<div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-500 tracking-wide mb-2">
				<span className="text-blue-600">{steps[currentIndex]?.label}</span>
			</div>

			<div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
				<div
					className="h-full bg-linear-to-r from-blue-500 to-cyan-500 transition-all duration-500"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="mt-3 flex justify-between text-[0.65rem] text-gray-400 uppercase tracking-wide">
				{steps.map((step, i) => (
					<span
						key={step.id}
						className={i <= currentIndex ? "text-blue-500 font-semibold" : ""}
					>
						{step.label}
					</span>
				))}
			</div>
		</div>
	);
}
