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
	Img,
} from "@react-email/components";

interface ReminderEmailProps {
	name: string;
	company: string;
	service: string;
	date: string;
	slot: string;
	ref: string;
	logoUrl?: string;
}

export default function ReminderEmail({
	name,
	company,
	service,
	date,
	slot,
	ref,
	logoUrl,
}: ReminderEmailProps) {
	const formattedDate = new Date(date).toLocaleDateString(undefined, {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.geoserv.org";

	return (
		<Html>
			<Head />
			<Preview>Your {company} appointment reminder</Preview>
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
						maxWidth: "600px",
						margin: "48px auto",
						background: "#ffffff",
						borderRadius: "18px",
						padding: "44px 36px",
						boxShadow:
							"0 10px 30px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.04)",
						border: "1px solid #e5e7eb",
					}}
				>
					{/* Logo Header */}
					<Section style={{ textAlign: "center", marginBottom: "20px" }}>
						{logoUrl ? (
							<Img
								src={logoUrl}
								alt={`${company} logo`}
								width="80"
								style={{ marginBottom: "10px", borderRadius: "8px" }}
							/>
						) : (
							<Heading
								style={{
									fontSize: "24px",
									fontWeight: 700,
									color: "#0f172a",
									margin: 0,
								}}
							>
								GeoServ
							</Heading>
						)}
					</Section>

					{/* Title + Subtitle */}
					<Section style={{ textAlign: "center", marginBottom: "32px" }}>
						<Heading
							style={{
								fontSize: "26px",
								fontWeight: 700,
								color: "#0f172a",
								marginBottom: "8px",
							}}
						>
							Appointment Reminder
						</Heading>
						<Text
							style={{
								fontSize: "15px",
								color: "#64748b",
								margin: 0,
							}}
						>
							Your appointment with <strong>{company}</strong> is coming up
							soon.
						</Text>
					</Section>

					{/* Appointment Details */}
					<Section
						style={{
							background: "linear-gradient(145deg, #eef7ff 0%, #ebfef4 100%)",
							borderRadius: "12px",
							padding: "20px 24px",
							marginBottom: "36px",
							border: "1px solid #dbeafe",
						}}
					>
						<Text
							style={{
								fontSize: "15px",
								lineHeight: "1.7",
								margin: "0 0 14px 0",
								color: "#0f172a",
							}}
						>
							<strong>Hi {name},</strong>
							<br />
							We’re looking forward to seeing you! Here are your appointment
							details:
						</Text>

						<Hr style={{ borderColor: "#dbeafe", margin: "18px 0" }} />

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

					{/* Action Buttons */}
					<Section style={{ textAlign: "center", marginBottom: "40px" }}>
						<div
							style={{
								display: "inline-block",
								textAlign: "center",
								marginTop: "12px",
							}}
						>
							<Button
								href={`${baseUrl}/api/booking/confirm?token=${ref}`}
								style={{
									background:
										"linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
									color: "#ffffff",
									padding: "12px 28px",
									borderRadius: "10px",
									fontWeight: 600,
									textDecoration: "none",
									fontSize: "15px",
									boxShadow: "0 4px 10px rgba(34,197,94,0.25)",
									marginRight: "18px", // ✅ fixed horizontal spacing
									display: "inline-block",
								}}
							>
								✅ Confirm
							</Button>

							<Button
								href={`${baseUrl}/api/booking/cancel?token=${ref}`}
								style={{
									background:
										"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
									color: "#ffffff",
									padding: "12px 28px",
									borderRadius: "10px",
									fontWeight: 600,
									textDecoration: "none",
									fontSize: "15px",
									boxShadow: "0 4px 10px rgba(239,68,68,0.25)",
									display: "inline-block",
								}}
							>
								✖ Cancel
							</Button>
						</div>
					</Section>

					{/* Footer */}
					<Hr style={{ borderColor: "#e5e7eb", marginBottom: "12px" }} />
					<Text
						style={{
							fontSize: "12px",
							color: "#9ca3af",
							textAlign: "center",
							lineHeight: "1.6",
						}}
					>
						© {new Date().getFullYear()} GeoServ, Inc.
						<br />
						This email was sent automatically — please do not reply.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
