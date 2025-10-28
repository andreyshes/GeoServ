import { PrismaClient, ServiceAreaType } from "@prisma/client";

if (process.env.NODE_ENV === "production") {
	console.log("❌ Skipping database seed — production mode detected.");
	process.exit(0);
}

const db = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// -------------------------------
	// 🏢 Company A - CleanPro
	// -------------------------------
	const companyACustomId = "company-cleanpro";
	const companyA = await db.company.upsert({
		where: { id: companyACustomId },
		update: {},
		create: {
			id: companyACustomId,
			name: "CleanPro Services",
			domain: "cleanpro.com",
			logoUrl: "https://placehold.co/200x50?text=CleanPro",
			stripeAccountId: "acct_1Q2Y6YourStripeAccount",
			subscriptionStatus: "active",
			serviceAreas: {
				create: [
					{
						name: "Downtown Vancouver (5km radius)",
						type: ServiceAreaType.RADIUS,
						centerLat: 49.2827,
						centerLng: -123.1207,
						radiusKm: 5,
					},
					{
						name: "Burnaby Service Zone",
						type: ServiceAreaType.POLYGON,
						polygon: {
							type: "Polygon",
							coordinates: [
								[
									[-123.0, 49.25],
									[-123.0, 49.3],
									[-122.9, 49.3],
									[-122.9, 49.25],
									[-123.0, 49.25],
								],
							],
						},
					},
				],
			},
		},
	});

	// -------------------------------
	// 🧽 CleanPro Services
	// -------------------------------
	await db.service.createMany({
		data: [
			{
				name: "Carpet Cleaning",
				priceCents: 12000,
				durationText: "2 hours",
				companyId: companyA.id,
			},
			{
				name: "Window Washing",
				priceCents: 8000,
				durationText: "1.5 hours",
				companyId: companyA.id,
			},
			{
				name: "General Cleaning",
				priceCents: 20000,
				durationText: "3 hours",
				companyId: companyA.id,
			},
		],
	});

	const testCustomer = await db.customer.upsert({
		where: { email: "test@example.com" },
		update: {},
		create: {
			firstName: "John",
			lastName: "Doe",
			email: "test@example.com",
			phone: "+1 (555) 555-1234",
		},
	});

	await db.booking.createMany({
		data: [
			{
				customerId: testCustomer.id,
				companyId: companyA.id,
				serviceType: "Carpet Cleaning",
				date: new Date("2025-10-15T09:00:00Z"),
				slot: "8–10",
				status: "confirmed",
				paid: true,
				amountCents: 12000,
				address: "123 Main St, Vancouver, BC",
				addressLat: 49.283,
				addressLng: -123.121,
			},
			{
				customerId: testCustomer.id,
				companyId: companyA.id,
				serviceType: "Window Washing",
				date: new Date("2025-10-16T13:00:00Z"),
				slot: "12–2",
				status: "pending",
				paid: false,
				amountCents: 8000,
				address: "456 Oak Ave, Vancouver, BC",
				addressLat: 49.283,
				addressLng: -123.121,
			},
			{
				customerId: testCustomer.id,
				companyId: companyA.id,
				serviceType: "General Cleaning",
				date: new Date("2025-10-18T16:00:00Z"),
				slot: "4–6",
				status: "confirmed",
				paid: false,
				amountCents: 20000,
				address: "789 Pine Rd, Vancouver, BC",
				addressLat: 49.283,
				addressLng: -123.121,
			},
		],
	});

	console.log(`✅ Seeded company: ${companyA.name}`);
	console.log(`🆔 Company ID: ${companyA.id}`);
	console.log(`🌍 Service areas count: 2`);
	console.log(`👤 Customer: ${testCustomer.email}`);
	console.log(`📅 Bookings: 3 created`);

	// -------------------------------
	// 🔧 Company B - HandyHome
	// -------------------------------
	const companyBCustomId = "company-handyhome";
	const companyB = await db.company.upsert({
		where: { id: companyBCustomId },
		update: {},
		create: {
			id: companyBCustomId,
			name: "HandyHome Repairs",
			domain: "handyhome.com",
			logoUrl: "https://placehold.co/200x50?text=HandyHome",
			stripeAccountId: "acct_1Q2Y6YourStripeAccount",
			subscriptionStatus: "active",
			serviceAreas: {
				create: [
					{
						name: "Seattle Metro (15km)",
						type: ServiceAreaType.RADIUS,
						centerLat: 47.6062,
						centerLng: -122.3321,
						radiusKm: 15,
					},
				],
			},
		},
	});

	await db.service.createMany({
		data: [
			{
				name: "Plumbing Repair",
				priceCents: 15000,
				durationText: "1 hour",
				companyId: companyB.id,
			},
			{
				name: "Electrical Fix",
				priceCents: 18000,
				durationText: "1.25 hours",
				companyId: companyB.id,
			},
		],
	});

	console.log(`✅ Seeded company: ${companyB.name}`);
	console.log("✅ Seeding complete!");
}

main()
	.catch((e) => {
		console.error("❌ Seed error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
