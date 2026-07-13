import Stripe from "stripe";

/** Client Stripe côté serveur uniquement (clé secrète, jamais exposée au navigateur). */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
