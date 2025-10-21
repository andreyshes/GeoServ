"use client";

const steps = [
	"Address",
	"Availability",
	"Calendar",
	"Details",
	"Payment",
	"Confirm",
];

export default function Stepper({ step }: { step: number }) {
	return (
		<div className="flex justify-between items-center max-w-3xl mx-auto mb-12 px-6">
			{steps.map((label, i) => {
				const isActive = i <= step;

				return (
					<div key={label} className="flex flex-col items-center flex-1 z-10">
						{/* Step circle */}
						<div
							className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-medium transition-all duration-300 ${
								isActive
									? "bg-blue-600 border-blue-600 text-white shadow-sm"
									: "bg-white border-gray-300 text-gray-400"
							}`}
						>
							{i + 1}
						</div>

						{/* Step label */}
						<span
							className={`mt-2 text-xs font-medium ${
								isActive ? "text-blue-600" : "text-gray-400"
							}`}
						>
							{label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
