import {
	Html,
	Head,
	Body,
	Container,
	Heading,
	Text,
	Button,
	Hr,
	Preview,
	Section,
} from "@react-email/components";

interface BookingConfirmationEmailProps {
	name: string;
	company: string;
	service: string;
	date: string;
	slot: string;
	ref: string;
	receiptUrl?: string;
}

export default function BookingConfirmationEmail({
	name,
	company,
	service,
	date,
	slot,
	ref,
	receiptUrl,
}: BookingConfirmationEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Your {company} booking is confirmed ✅</Preview>
			<Body
				style={{
					backgroundColor: "#f9fafb",
					fontFamily: "Arial, sans-serif",
					color: "#222",
				}}
			>
				<Container
					style={{
						maxWidth: "600px",
						margin: "40px auto",
						background: "#ffffff",
						padding: "32px",
						borderRadius: "8px",
						border: "1px solid #e5e7eb",
						lineHeight: "1.6",
					}}
				>
					<Heading
						style={{
							color: "#16a34a",
							fontSize: "24px",
							marginBottom: "16px",
						}}
					>
						Booking Confirmed ✅
					</Heading>

					<Text style={{ fontSize: "16px", marginBottom: "12px" }}>
						Hi {name},
					</Text>

					<Text style={{ fontSize: "16px", marginBottom: "12px" }}>
						Thank you for booking with <strong>{company}</strong>!
					</Text>

					<Text style={{ fontSize: "16px", marginBottom: "16px" }}>
						Here are your booking details:
					</Text>

					<Section
						style={{
							background: "#f3f4f6",
							padding: "16px",
							borderRadius: "6px",
							marginBottom: "20px",
						}}
					>
						<Text>
							<strong>Reference:</strong> {ref}
						</Text>
						<Text>
							<strong>Service:</strong> {service}
						</Text>
						<Text>
							<strong>Date:</strong> {date}
						</Text>
						<Text>
							<strong>Time Slot:</strong> {slot}
						</Text>
					</Section>

					{receiptUrl && (
						<Button
							href={receiptUrl}
							style={{
								backgroundColor: "#16a34a",
								color: "#ffffff",
								padding: "12px 20px",
								borderRadius: "8px",
								textDecoration: "none",
								fontSize: "16px",
								fontWeight: "bold",
								marginBottom: "16px",
							}}
						>
							View Payment Receipt
						</Button>
					)}
					<Text style={{ fontSize: "16px", marginBottom: "20px" }}>
						Your booking is confirmed and we look forward to serving you!
					</Text>

					<Hr style={{ margin: "24px 0" }} />

					<Text
						style={{
							fontSize: "14px",
							color: "#555",
							marginBottom: "8px",
						}}
					>
						Best,
						<br />
						<strong>GeoServ Team</strong>
						<br />
						<a
							href="https://geoserv.org"
							style={{ color: "#16a34a", textDecoration: "none" }}
						>
							geoserv.org
						</a>
					</Text>

					<Text
						style={{ fontSize: "12px", color: "#9ca3af", marginTop: "20px" }}
					>
						© {new Date().getFullYear()} GeoServ. All rights reserved.
					</Text>
				</Container>
			</Body>
		</Html>
	);
}
