import twilio from "twilio";

const client = twilio(
	process.env.TWILIO_ACCOUNT_SID!,
	process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string) {
	try {
		await client.messages.create({
			body,
			from: process.env.TWILIO_PHONE_NUMBER!,
			to,
		});
		console.log("✅ SMS sent successfully to", to);
	} catch (error) {
		console.error("❌ Failed to send SMS:", error);
	}
}
