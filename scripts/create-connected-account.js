import Stripe from "stripe";
import "dotenv/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

async function resendOnboarding() {
	const link = await stripe.accountLinks.create({
		account: "acct_1SNhW1PBOC1UQwTe",
		refresh_url: "https://www.geoserv.org/reauth",
		return_url: "https://www.geoserv.org/onboarding/success",
		type: "account_onboarding",
	});

	console.log("👉 Onboarding link:", link.url);
}

resendOnboarding();
