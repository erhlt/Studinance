import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Onboarding() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refresh } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [hochschule, setHochschule] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [budget, setBudget] = useState<number | "">("");
  const [bafoeg, setBafoeg] = useState("unbekannt");
  const [busy, setBusy] = useState(false);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;
  if (!profileLoading && profile?.onboarding_completed) return <Navigate to="/app" replace />;

  const totalSteps = 3;

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: name || null,
      hochschule: hochschule || null,
      semester: typeof semester === "number" ? semester : null,
      monthly_budget: typeof budget === "number" ? budget : 0,
      bafoeg_status: bafoeg,
      onboarding_completed: true,
    }).eq("user_id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="text-xs text-muted-foreground mb-2">
          {t("onboarding.step")} {step} {t("onboarding.of")} {totalSteps}
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("onboarding.welcome")}</h2>
            <p className="text-sm text-muted-foreground">{t("onboarding.welcomeText")}</p>
            <div className="space-y-2">
              <Label htmlFor="name">{t("onboarding.nameLabel")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboarding.namePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hs">{t("onboarding.hochschuleLabel")}</Label>
              <Input id="hs" value={hochschule} onChange={(e) => setHochschule(e.target.value)} placeholder={t("onboarding.hochschulePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sem">{t("onboarding.semesterLabel")}</Label>
              <Input id="sem" type="number" min={1} max={20} value={semester} onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : "")} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("onboarding.budgetTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("onboarding.budgetText")}</p>
            <div className="space-y-2">
              <Label htmlFor="budget">{t("onboarding.budgetLabel")}</Label>
              <Input id="budget" type="number" min={0} step={10} value={budget} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : "")} placeholder="850" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t("onboarding.bafoegTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("onboarding.bafoegText")}</p>
            <div className="space-y-2">
              {[
                { v: "ja", label: t("onboarding.bafoegYes") },
                { v: "beantragt", label: t("onboarding.bafoegApplied") },
                { v: "nein", label: t("onboarding.bafoegNo") },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setBafoeg(o.v)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    bafoeg === o.v ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:bg-secondary"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              {t("onboarding.back")}
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1">
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button onClick={finish} disabled={busy} className="flex-1">
              {t("onboarding.finish")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}