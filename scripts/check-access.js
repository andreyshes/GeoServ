import Stripe from "stripe";
import "dotenv/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

const accountId = "acct_1SNhW0AXg7JTP0Sd";
async function main() {
	try {
		const account = await stripe.accounts.retrieve(accountId);
		console.log("✅ Access confirmed! Account info:");
		console.log({
			id: account.id,
			email: account.email,
			type: account.type,
			capabilities: account.capabilities,
		});
	} catch (err) {
		console.error("❌ Unable to access this account:", err.message);
	}
}

main();
