import * as React from "react";
import {
	Html,
	Head,
	Body,
	Container,
	Text,
	Heading,
	Hr,
	Link,
} from "@react-email/components";

interface NotServicedEmailProps {
	address: string;
}

export const NotServicedEmail = ({ address }: NotServicedEmailProps) => (
	<Html>
		<Head />
		<Body style={{ backgroundColor: "#f6f9fc", padding: "20px" }}>
			<Container
				style={{
					backgroundColor: "#ffffff",
					borderRadius: "8px",
					padding: "24px",
				}}
			>
				<Heading style={{ color: "#111827", fontSize: "22px" }}>
					We’ll be expanding soon 🚀
				</Heading>
				<Text style={{ fontSize: "16px", color: "#374151" }}>
					Hi there! Thanks for checking if GeoServ services your area.
				</Text>
				<Text style={{ fontSize: "16px", color: "#374151" }}>
					Unfortunately, we’re not active in <strong>{address}</strong> yet —
					but we’re growing fast.
				</Text>
				<Text style={{ fontSize: "16px", color: "#374151" }}>
					You’ll be the first to know when we launch nearby. Stay tuned!
				</Text>
				<Hr style={{ margin: "24px 0" }} />
				<Text style={{ fontSize: "14px", color: "#9ca3af" }}>
					© {new Date().getFullYear()} GeoServ. All rights reserved.
				</Text>
			</Container>
		</Body>
	</Html>
);

export default NotServicedEmail;
