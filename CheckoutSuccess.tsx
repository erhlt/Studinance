import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Sparkles, TrendingUp, Download, Briefcase, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";

export default function CheckoutSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPremium, refresh } = useRoles();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Force backend to sync the new subscription from Stripe → DB → role
        await supabase.functions.invoke("check-subscription");
        await refresh?.();
      } catch (e) {
        // Even if it fails, the webhook will catch up — show the page anyway
        console.warn("check-subscription failed", e);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    { icon: TrendingUp, label: t("checkoutSuccess.feature1") },
    { icon: Download, label: t("checkoutSuccess.feature2") },
    { icon: Briefcase, label: t("checkoutSuccess.feature3") },
  ];

  return (
    <div className="min-h-[80vh] p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-lg p-8 text-center space-y-6 shadow-[var(--shadow-elevated)]">
        <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          {syncing ? (
            <Loader2 className="w-8 h-8 text-success animate-spin" />
          ) : (
            <CheckCircle2 className="w-9 h-9 text-success" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {t("checkoutSuccess.title")}
          </h1>
          <p className="text-muted-foreground">
            {syncing ? t("checkoutSuccess.syncing") : t("checkoutSuccess.subtitle")}
          </p>
        </div>

        <ul className="text-left space-y-2 bg-secondary/60 rounded-xl p-4">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1"
            disabled={syncing && !isPremium}
            onClick={() => navigate("/app")}
          >
            <Sparkles className="w-4 h-4" />
            {t("checkoutSuccess.ctaPremium")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/app/profile")}
          >
            {t("checkoutSuccess.ctaProfile")}
          </Button>
        </div>
      </Card>
    </div>
  );
}