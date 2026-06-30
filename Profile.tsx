import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LogOut, Sparkles, CheckCircle2, XCircle, AlertTriangle, CalendarClock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, ready, signOut } = useAuth();
  const { profile, loading: profileLoading, resolved: profileResolved, error: profileError, refresh } = useProfile();
  const { isPremium, refresh: refreshRoles } = useRoles();
  const [params, setParams] = useSearchParams();

  const [name, setName] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [bafoeg, setBafoeg] = useState("unbekannt");
  const [budget, setBudget] = useState<string>("");
  const [savings, setSavings] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [cancelEndsAt, setCancelEndsAt] = useState<Date | null>(null);
  const [canceled, setCanceled] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Preload Stripe.js as soon as the profile page mounts so the upgrade
  // dialog opens instantly on mobile/iPad instead of waiting for the
  // Stripe SDK to download after the click.
  useEffect(() => {
    if (!isPremium && isPaymentsConfigured()) {
      getStripe().catch(() => { /* ignore preload errors */ });
    }
  }, [isPremium]);

  // Load subscription state from new subscriptions table
  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("cancel_at_period_end, current_period_end, status")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.cancel_at_period_end && data.current_period_end) {
          setCanceled(true);
          setCancelEndsAt(new Date(data.current_period_end as string));
        } else {
          setCanceled(false);
          setCancelEndsAt(null);
        }
      });
  }, [user, isPremium]);

  // Realtime updates on subscription changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("subscriptions-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => {
          refreshRoles();
          refresh();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh, refreshRoles]);

  const endsAt = cancelEndsAt;

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setHochschule(profile.hochschule ?? "");
      setSemester(profile.semester?.toString() ?? "");
      setBafoeg(profile.bafoeg_status ?? "unbekannt");
      setBudget(profile.monthly_budget?.toString() ?? "");
      setSavings(profile.savings_goal?.toString() ?? "");
    }
  }, [profile]);

  // Handle return from Stripe checkout
  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast.success(t("profile.premiumActive"));
      setParams({});
      setCheckoutOpen(false);
      // Webhook should already have created the row; force-refresh to pick it up
      setTimeout(() => { refresh({ force: true }); refreshRoles(); }, 1500);
    }
  }, [params, t, setParams, refresh, refreshRoles]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    // Use upsert so saving still works if the profile row was never created
    // (e.g. signup race or a failed onboarding insert) — otherwise update()
    // returns a successful response with 0 rows affected and the user thinks
    // their data was saved when it silently wasn't.
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: name || null,
      hochschule: hochschule || null,
      semester: semester ? Number(semester) : null,
      bafoeg_status: bafoeg,
      monthly_budget: budget ? Number(budget) : 0,
      savings_goal: savings ? Number(savings) : 0,
      language: i18n.language,
    }, { onConflict: "user_id" });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("profile.saved")); refresh({ force: true }); }
  };

  const upgrade = () => {
    if (busy || checkoutOpen) return;
    setCheckoutOpen(true);
  };

  const cancel = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("cancel-subscription", {
      body: { environment: getStripeEnvironment() },
    });
    if (error || !data) {
      setBusy(false);
      toast.error(error?.message || t("common.error"));
      return;
    }
    if (data.error) {
      setBusy(false);
      toast.error(data.error);
      return;
    }
    const newEndsAt = data.cancel_at ? new Date(data.cancel_at * 1000) : null;
    if (newEndsAt) setCancelEndsAt(newEndsAt);
    setCanceled(true);
    await refresh();
    setBusy(false);
    const dateStr = newEndsAt ? newEndsAt.toLocaleDateString() : "";
    if (data.alreadyCanceled) {
      toast.info(t("profile.cancelAlready", { date: dateStr }));
    } else {
      toast.success(t("profile.cancelSuccess", { date: dateStr }));
    }
  };

  if (!ready || (user && (!profileResolved || profileLoading))) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-40 bg-secondary rounded animate-pulse" />
        <div className="h-32 bg-secondary rounded-2xl animate-pulse" />
        <div className="h-64 bg-secondary rounded-2xl animate-pulse" />
        <div className="h-16 bg-secondary rounded-2xl animate-pulse" />
      </div>
    );
  }

  // If profile load errored AND no cached data, show error UI with retry
  // instead of silently rendering an empty form that can't actually save.
  if (user && profileError && !profile) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("profile.title")}</h1>
        <Card className="p-6 space-y-4 border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <h2 className="font-semibold">{t("common.error")}</h2>
              <p className="text-sm text-muted-foreground break-words">{profileError}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refresh({ force: true })} disabled={busy}>
              {t("common.retry")}
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />{t("auth.signout")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("profile.title")}</h1>

      {/* Premium card */}
      <Card className={`p-6 ${isPremium ? "" : "bg-gradient-primary text-primary-foreground border-0"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold">{isPremium ? t("profile.premiumActive") : t("profile.upgradeToPro")}</h2>
              {isPremium && <Badge variant="secondary">{t("profile.premium")}</Badge>}
            </div>
            <p className={`text-sm mt-1 ${isPremium ? "text-muted-foreground" : "opacity-90"}`}>{t("profile.premiumDesc")}</p>
            {!isPremium && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {Object.values(t("profile.upgradeBenefits", { returnObjects: true }) as Record<string, string>).map((b) => (
                  <li key={b} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {b}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-right shrink-0">
            {!isPremium && <div className="text-sm opacity-90 mb-2">{t("profile.pricePerMonth")}</div>}
            {isPremium ? (
              <div className="flex flex-col gap-2 items-end">
                {endsAt && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {t("profile.cancelEndsOn", { date: endsAt.toLocaleDateString() })}
                  </div>
                )}
                {!canceled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("profile.cancelSub")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                          {t("profile.cancelConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("profile.cancelConfirmDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <ul className="space-y-2 text-sm text-foreground bg-secondary/60 rounded-lg p-4 -mt-2">
                        {([1, 2, 3, 4, 5] as const).map((n) => (
                          <li key={n} className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <span>{t(`profile.cancelDrawback${n}`)}</span>
                          </li>
                        ))}
                      </ul>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>{t("profile.cancelKeep")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={cancel}
                          disabled={busy}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("profile.cancelConfirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={upgrade} disabled={busy || checkoutOpen}>
                {t("profile.upgradeToPro")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Embedded Stripe checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("profile.upgradeToPro")}</DialogTitle>
          </DialogHeader>
          {checkoutOpen && (
            <StripeEmbeddedCheckout
              priceId="premium_monthly"
              returnUrl={`${window.location.origin}/app/profile?checkout=success`}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Profile form */}
      <Card className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("profile.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.hochschule")}</Label>
            <Input value={hochschule} onChange={(e) => setHochschule(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.semester")}</Label>
            <Input type="number" min={1} max={20} value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.bafoegStatus")}</Label>
            <Select value={bafoeg} onValueChange={setBafoeg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">{t("onboarding.bafoegYes")}</SelectItem>
                <SelectItem value="beantragt">{t("onboarding.bafoegApplied")}</SelectItem>
                <SelectItem value="nein">{t("onboarding.bafoegNo")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("profile.monthlyBudget")} (€)</Label>
            <Input type="number" min={0} step={10} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("profile.savingsGoal")} (€)</Label>
            <Input type="number" min={0} step={10} value={savings} onChange={(e) => setSavings(e.target.value)} />
          </div>
        </div>
        <Button onClick={save} disabled={busy}>{t("profile.save")}</Button>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{user?.email}</div>
        <Button variant="ghost" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />{t("auth.signout")}</Button>
      </Card>
    </div>
  );
}
