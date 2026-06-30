import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Wallet, GraduationCap, Briefcase, ArrowRight, CheckCircle2, Sparkles, Users } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import headerLogo from "@/assets/studinance-header.webp";
import logo from "@/assets/studinance-logo.webp";

export default function Landing() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/app" replace />;

  const features = [
    { icon: Wallet, title: t("landing.feature1Title"), desc: t("landing.feature1Desc") },
    { icon: GraduationCap, title: t("landing.feature2Title"), desc: t("landing.feature2Desc") },
    { icon: Briefcase, title: t("landing.feature3Title"), desc: t("landing.feature3Desc") },
  ];

  const howSteps = [
    { title: t("landing.howStep1Title"), desc: t("landing.howStep1Desc") },
    { title: t("landing.howStep2Title"), desc: t("landing.howStep2Desc") },
    { title: t("landing.howStep3Title"), desc: t("landing.howStep3Desc") },
  ];

  const freeFeatures = [
    t("landing.freePlanFeature1"),
    t("landing.freePlanFeature2"),
    t("landing.freePlanFeature3"),
    t("landing.freePlanFeature4"),
  ];

  const premiumFeatures = [
    t("landing.premiumPlanFeature1"),
    t("landing.premiumPlanFeature2"),
    t("landing.premiumPlanFeature3"),
    t("landing.premiumPlanFeature4"),
    t("landing.premiumPlanFeature5"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur z-30">
        <Link to="/" className="flex items-center gap-2 hover-lift">
          <img src={headerLogo} alt="Studinance" width="144" height="36" decoding="async" className="h-8 sm:h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm"><Link to="/auth">{t("landing.login")}</Link></Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/auth?mode=signup">{t("landing.cta")}</Link>
          </Button>
        </div>
      </header>

      <main className="px-4 sm:px-8">
        {/* Hero */}
        <section className="max-w-3xl mx-auto text-center py-16 sm:py-24 animate-fade-in">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            width="96"
            height="96"
            fetchPriority="high"
            decoding="async"
            className="mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-8 animate-float drop-shadow-xl"
          />
          {/* Social proof */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-medium mb-6">
            <Users className="w-3.5 h-3.5" />
            {t("landing.socialProof")}
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            {t("landing.hero")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">{t("landing.sub")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="shadow-[var(--shadow-elevated)] hover-lift">
              <Link to="/auth?mode=signup">
                {t("landing.cta")} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4 pb-20">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 bg-card border rounded-2xl card-smooth animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{t("landing.howItWorksTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {howSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-[var(--shadow-elevated)]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto pb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">{t("landing.pricingTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("landing.pricingSubtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("landing.freePlanName")}</div>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-bold">{t("landing.freePlanPrice")}</span>
                  <span className="text-sm text-muted-foreground mb-1">{t("landing.freePlanPeriod")}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/auth?mode=signup">{t("landing.freeCta")}</Link>
              </Button>
            </div>

            {/* Premium */}
            <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 flex flex-col gap-4 shadow-[var(--shadow-elevated)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium opacity-90">{t("landing.premiumPlanName")}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> Pro
                  </span>
                </div>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-3xl font-bold">{t("landing.premiumPlanPrice")}</span>
                  <span className="text-sm opacity-80 mb-1">{t("landing.premiumPlanPeriod")}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" className="w-full mt-2">
                <Link to="/auth?mode=signup">{t("landing.premiumCta")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Studinance</span>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">AGB</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link to="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
