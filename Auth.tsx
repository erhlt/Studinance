import { useState, FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import headerLogo from "@/assets/studinance-header.webp";
import logo from "@/assets/studinance-logo.webp";

export default function Auth() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!authLoading && user) return <Navigate to="/app" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast.success(t("auth.success"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || t("auth.error"));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
    if (result.error) {
      toast.error(t("auth.error"));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between border-b">
        <Link to="/" className="flex items-center gap-2 hover-lift">
          <img src={headerLogo} alt="Studinance" className="h-8 sm:h-9 w-auto" />
        </Link>
        <LanguageSwitcher />
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)] animate-scale-in">
          <img src={logo} alt="" aria-hidden="true" className="mx-auto w-14 h-14 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-center">{mode === "signin" ? t("auth.welcome") : t("auth.signupTitle")}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> {t("auth.or")} <div className="flex-1 h-px bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google} disabled={busy}>
            {t("auth.google")}
          </Button>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button type="button" className="text-primary font-medium" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? t("auth.signupHere") : t("auth.signinHere")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}