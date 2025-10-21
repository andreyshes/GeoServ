import {
	Html,
	Head,
	Body,
	Container,
	Heading,
	Text,
	Button,
	Preview,
	Hr,
	Section,
} from "@react-email/components";

interface ReminderEmailProps {
	name: string;
	company: string;
	service: string;
	date: string;
	slot: string;
	ref: string;
}

export default function ReminderEmail({
	name,
	company,
	service,
	date,
	slot,
	ref,
}: ReminderEmailProps) {
	const formattedDate = new Date(date).toLocaleDateString(undefined, {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	return (
		<Html>
			<Head />
			<Preview>Your {company} appointment is coming up</Preview>
			<Body
				style={{
					margin: 0,
					backgroundColor: "#f8fafc",
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
					color: "#111827",
				}}
			>
				<Container
					style={{
						maxWidth: "620px",
						margin: "48px auto",
						background: "#ffffff",
						borderRadius: "16px",
						padding: "48px 40px",
						boxShadow:
							"0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
						border: "1px solid #e5e7eb",
					}}
				>
					{/* Header */}
					<Section style={{ textAlign: "center", marginBottom: "32px" }}>
						<Heading
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#0f172a",
								marginBottom: "8px",
							}}
						>
							Appointment Reminder
						</Heading>
						<Text
							style={{
								fontSize: "16px",
								color: "#64748b",
								marginBottom: "0",
							}}
						>
							Your appointment with <strong>{company}</strong> is scheduled
							soon.
						</Text>
					</Section>

					{/* Appointment Details */}
					<Section
						style={{
							background:
								"linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #dbeafe 100%)",
							borderRadius: "12px",
							padding: "24px 28px",
							marginBottom: "40px",
							border: "1px solid #dbeafe",
						}}
					>
						<Text style={{ fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
							<strong style={{ color: "#0f172a" }}>Hi {name},</strong>
							<br />
							We’re looking forward to seeing you! Here are your appointment
							details:
						</Text>

						<Hr style={{ borderColor: "#dbeafe", margin: "20px 0" }} />

						<Text
							style={{
								fontSize: "15px",
								lineHeight: "1.6",
								color: "#1e3a8a",
								margin: 0,
							}}
						>
							<strong>Service:</strong> {service}
							<br />
							<strong>Date:</strong> {formattedDate}
							<br />
							<strong>Time:</strong> {slot}
							<br />
							<strong>Reference:</strong> {ref}
						</Text>
					</Section>

					{/* Buttons */}
					<Section
						style={{
							display: "flex",
							justifyContent: "center",
							gap: "16px",
							flexWrap: "wrap",
							marginBottom: "40px",
						}}
					>
						<Button
							href={`${baseUrl}/api/booking/confirm?token=${ref}`}
							style={{
								background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
								color: "#ffffff",
								padding: "14px 32px",
								borderRadius: "10px",
								fontWeight: 600,
								textDecoration: "none",
								fontSize: "15px",
								boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
							}}
						>
							✅ Confirm Appointment
						</Button>

						<Button
							href={`${baseUrl}/api/booking/cancel?token=${ref}`}
							style={{
								background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
								color: "#ffffff",
								padding: "14px 32px",
								borderRadius: "10px",
								fontWeight: 600,
								textDecoration: "none",
								fontSize: "15px",
								boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
							}}
						>
							✖ Cancel Appointment
						</Button>
					</Section>

					{/* Footer */}
					<Hr style={{ borderColor: "#e5e7eb", marginBottom: "16px" }} />
					<Text
						style={{
							fontSize: "13px",
							color: "#9ca3af",
							textAlign: "center",
							lineHeight: "1.6",
						}}
					>
						© {new Date().getFullYear()} GeoServ, Inc. <br />
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
