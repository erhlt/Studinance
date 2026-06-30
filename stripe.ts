import { loadStripe, Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const environment: StripeEnv = clientToken?.startsWith("pk_test_") ? "sandbox" : "live";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      // Return a rejected promise instead of throwing synchronously so callers
      // using `.catch()` (e.g. preload calls in Profile) handle it correctly,
      // and `useMemo(() => getStripe(), ...)` doesn't crash the component
      // tree at render time when the env var is missing in production.
      stripePromise = Promise.reject(
        new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set"),
      );
    } else {
      stripePromise = loadStripe(clientToken);
    }
  }
  return stripePromise;
}

export function isPaymentsConfigured(): boolean {
  return !!clientToken;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}