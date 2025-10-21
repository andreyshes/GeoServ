import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const bookings = await db.booking.findMany({
		include: {
			company: { select: { name: true, stripeAccountId: true } },
			customer: { select: { firstName: true, lastName: true, email: true } },
		},
	});
	const booking = await db.booking.findFirst();
	console.log(booking?.addressLat);

	console.log(JSON.stringify(bookings, null, 2));
	await db.$disconnect();
}

main();
