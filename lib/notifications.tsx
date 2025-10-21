import { Resend } from "resend";
import { render } from "@react-email/render";
import BookingConfirmationEmail from "@/app/emails/BookingConfirmationEmail";
import ReminderEmail from "@/app/emails/ReminderEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface ConfirmationEmailProps {
	to: string;
	name: string;
	company: string;
	ref: string;
	service: string;
	date: string;
	slot: string;
	receiptUrl?: string;
}

export async function sendConfirmationEmail({
	to,
	name,
	company,
	ref,
	service,
	date,
	slot,
	receiptUrl,
}: ConfirmationEmailProps) {
	const emailHtml = await render(
		<BookingConfirmationEmail
			name={name}
			company={company}
			service={service}
			date={date}
			slot={slot}
			ref={ref}
			receiptUrl={receiptUrl ?? undefined}
		/>
	);

	await resend.emails.send({
		from: "GeoServ <no-reply@geoserv.org>",
		to,
		subject: `Your ${company} Booking Confirmation – Ref ${ref}`,
		html: emailHtml,
	});

	console.log(`📧 Confirmation email sent to ${to}`);
}

export async function sendReminderEmail({
	to,
	name,
	company,
	service,
	date,
	slot,
	ref,
}: {
	to: string;
	name: string;
	company: string;
	service: string;
	date: string;
	slot: string;
	ref: string;
}) {
	const emailHtml = await render(
		<ReminderEmail
			name={name}
			company={company}
			service={service}
			date={date}
			slot={slot}
			ref={ref}
		/>
	);

	await resend.emails.send({
		from: "GeoServ <no-reply@geoserv.org>",
		to,
		subject: `Reminder: Your ${company} appointment tomorrow (${slot})`,
		html: emailHtml,
		headers: {
			"Content-Type": "text/html; charset=UTF-8",
		},
	});

	console.log(`📧 Reminder sent to ${to}`);
}
