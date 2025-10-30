import Stripe from "stripe";
import "dotenv/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

async function main() {
	try {
		const accountId = "acct_1SNhW0AXgJ7JTP0Sd";
		const updated = await stripe.accounts.update(accountId, {
			capabilities: {
				transfers: { requested: true },
				card_payments: { requested: true },
			},
		});
		console.log("✅ Updated account capabilities:", updated.capabilities);
	} catch (err) {
		console.error("❌ Error updating account:", err);
	}
}

main();
