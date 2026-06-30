import { useCallback, useEffect, useMemo, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  priceId: string;
  returnUrl: string;
}

export function StripeEmbeddedCheckout({ priceId, returnUrl }: Props) {
  const stripePromise = useMemo(() => getStripe(), []);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track when Stripe.js has loaded so we can show a skeleton meanwhile.
  // Catch errors so a missing token / blocked CDN surfaces a clear message
  // instead of leaving the dialog stuck on the loading spinner forever.
  useEffect(() => {
    let cancelled = false;
    stripePromise.then(
      () => { if (!cancelled) setReady(true); },
      (err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Stripe.js failed to load");
        }
      },
    );
    return () => { cancelled = true; };
  }, [stripePromise]);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, returnUrl, environment: getStripeEnvironment() },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret;
  }, [priceId, returnUrl]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  if (loadError || !isPaymentsConfigured()) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
        <p className="text-sm font-medium">Bezahlung ist gerade nicht verfügbar</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {loadError ?? "VITE_PAYMENTS_CLIENT_TOKEN is not set"}
        </p>
      </div>
    );
  }

  return (
    <div id="checkout" className="relative min-h-[500px]">
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Bezahlung wird geladen…</p>
        </div>
      )}
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}