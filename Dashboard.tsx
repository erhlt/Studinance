import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useTransactions } from "@/hooks/useTransactions";
import { useRoles } from "@/hooks/useRoles";
import { useRecurring } from "@/hooks/useRecurring";
import { AICoachCard } from "@/components/AICoachCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Sparkles, Target, Flame, Plus, LineChart, Lightbulb } from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/PremiumGate";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, loading: txLoading } = useTransactions();
  const { isPremium } = useRoles();
  // Triggers auto-creation of due recurring transactions for the month.
  useRecurring();
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<Array<{ id: string; title: string; due_date: string }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bafoeg_deadlines")
      .select("id,title,due_date")
      .eq("user_id", user.id)
      .gte("due_date", new Date().toISOString().slice(0, 10))
      .order("due_date")
      .limit(3)
      .then(({ data }) => setDeadlines(data ?? []));
  }, [user]);

  const monthData = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const monthTx = transactions.filter((t) => t.occurred_on.startsWith(ym));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const byCat: Record<string, number> = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);
    });
    return { income, expenses, byCat, count: monthTx.length };
  }, [transactions]);

  const budget = Number(profile?.monthly_budget ?? 0);
  const remaining = budget - monthData.expenses;
  const savingsGoal = Number(profile?.savings_goal ?? 0);
  const saved = Math.max(0, monthData.income - monthData.expenses);
  const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((saved / savingsGoal) * 100)) : 0;

  const insights = useMemo(() => {
    const out: string[] = [];
    if (monthData.count === 0) { out.push(t("insights.noData")); return out; }
    if (budget > 0) {
      if (remaining >= 0) out.push(t("insights.onTrack", { amount: remaining.toFixed(0) }));
      else out.push(t("insights.overBudget", { amount: Math.abs(remaining).toFixed(0) }));
    }
    if (monthData.expenses > 0) {
      const food = monthData.byCat.food ?? 0;
      const foodPct = Math.round((food / monthData.expenses) * 100);
      if (foodPct >= 25) out.push(t("insights.foodHigh", { percent: foodPct }));
      const rent = monthData.byCat.rent ?? 0;
      const rentPct = Math.round((rent / monthData.expenses) * 100);
      if (rentPct >= 35) out.push(t("insights.rentHigh", { percent: rentPct }));
    }
    if (savingsGoal > 0 && saved > 0) out.push(t("insights.savingsProgress", { percent: savingsPct }));
    return out.slice(0, 3);
  }, [monthData, budget, remaining, t, savingsGoal, saved, savingsPct]);

  const streak = useMemo(() => {
    const days = new Set(transactions.map((t) => t.occurred_on));
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) s++;
      else break;
    }
    return s;
  }, [transactions]);

  // Multi-month trend — last 6 months for premium, 2 for free
  const monthsToShow = isPremium ? 6 : 2;
  const trendData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: monthsToShow }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsToShow - 1 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { month: "short" });
      const expenses = transactions
        .filter((t) => t.type === "expense" && t.occurred_on.startsWith(ym))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { label, expenses };
    });
  }, [transactions, monthsToShow]);

  const hasTrendData = trendData.some((d) => d.expenses > 0);

  const didYouKnowFacts = useMemo(
    () => [
      "Studenten in Deutschland geben im Schnitt rund 410 € pro Monat fürs Wohnen aus – der größte Posten im Budget.",
      "Im Schnitt geben Studierende etwa 170 € pro Monat für Lebensmittel aus. Wer selbst kocht, spart oft 30–40 %.",
      "Wer monatlich nur 50 € spart, hat nach dem Studium (5 Jahre) über 3.000 € auf der hohen Kante – ohne Zinsen.",
      "Rund 30 % der Studierenden in Deutschland haben Anspruch auf BAföG, aber viele beantragen es nie.",
      "Die 50/30/20-Regel: 50 % Fixkosten, 30 % Wünsche, 20 % Sparen – ein einfacher Start für jedes Budget.",
      "Ein Kaffee to-go pro Tag (3,50 €) kostet im Jahr über 1.270 € – mehr als eine Monatsmiete in vielen WGs.",
      "Studierende mit Budgetplan sparen laut Studien im Schnitt 20 % mehr als Studierende ohne Plan.",
      "Der durchschnittliche Studi-Haushalt gibt rund 35 € im Monat für Streaming & Abos aus – oft ungenutzt.",
    ],
    [],
  );
  const randomFact = useMemo(
    () => didYouKnowFacts[Math.floor(Math.random() * didYouKnowFacts.length)],
    [didYouKnowFacts],
  );

  const premiumInsights = useMemo(() => {
    if (monthData.count === 0) return null;
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const avgDaily = monthData.expenses / Math.max(1, dayOfMonth);
    const forecast = avgDaily * daysInMonth;
    const sorted = Object.entries(monthData.byCat).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const topPct = top && monthData.expenses > 0 ? Math.round((top[1] / monthData.expenses) * 100) : 0;
    const lastMonthYm = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
    const lastMonthExp = transactions
      .filter((t) => t.type === "expense" && t.occurred_on.startsWith(lastMonthYm))
      .reduce((s, t) => s + Number(t.amount), 0);
    let trend = "—";
    if (lastMonthExp > 0) {
      const diff = Math.round(((monthData.expenses - lastMonthExp) / lastMonthExp) * 100);
      trend = diff >= 0 ? `+${diff}%` : `${diff}%`;
    }
    return { avgDaily, forecast, top, topPct, trend };
  }, [monthData, transactions]);

  const loading = profileLoading || txLoading;

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 bg-secondary rounded animate-pulse w-56" />
        <div className="h-36 bg-secondary rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}
        </div>
        <div className="h-48 bg-secondary rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {profile?.display_name ? `${t("dashboard.greeting")}, ${profile.display_name} 👋` : t("dashboard.greetingNoName")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
          </p>
        </div>
        <div className="hidden" />
      </div>

      {/* Budget summary */}
      <Card
        className="p-6 text-primary-foreground border-0"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="text-sm text-primary-foreground/90">{t("dashboard.remaining")}</div>
        <div className="text-4xl font-bold mt-1 tabular-nums">€ {remaining.toFixed(2)}</div>
        <div className="mt-4 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-foreground transition-all duration-500"
            style={{ width: `${budget > 0 ? Math.min(100, (monthData.expenses / budget) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-primary-foreground/90">
          <span>{t("dashboard.spent")}: € {monthData.expenses.toFixed(2)}</span>
          <span>{t("dashboard.monthlyBudget")}: € {budget.toFixed(2)}</span>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="w-4 h-4 text-success" /> {t("dashboard.income")}
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">€ {monthData.income.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingDown className="w-4 h-4 text-accent" /> {t("dashboard.expenses")}
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">€ {monthData.expenses.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Target className="w-4 h-4 text-primary" /> {t("dashboard.savingsGoal")}
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">{savingsPct}%</div>
          <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${savingsPct}%` }} />
          </div>
          {savingsGoal > 0 && (
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              € {saved.toFixed(0)} / € {savingsGoal.toFixed(0)}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Flame className="w-4 h-4 text-warning" /> {t("dashboard.streak")}
          </div>
          <div className="text-xl font-bold mt-1">
            {streak} <span className="text-sm font-normal text-muted-foreground">{t("dashboard.days")}</span>
          </div>
        </Card>
      </div>

      {/* Spending Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("dashboard.spendingTrend")}</h2>
          <span className="text-xs text-muted-foreground">
            {isPremium ? t("dashboard.last6Months") : t("dashboard.last2Months")}
          </span>
        </div>
        {!hasTrendData ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl bg-secondary/40 border border-dashed border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Noch keine Daten</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Füge deine erste Transaktion hinzu, um deinen Ausgaben-Trend zu sehen.
            </p>
            <AddTransactionDialog
              trigger={
                <Button size="sm" className="mt-4">
                  <Plus className="w-4 h-4" />
                  Erste Transaktion hinzufügen
                </Button>
              }
            />
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 55%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(217 91% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`€ ${v.toFixed(2)}`, t("dashboard.expenses")]}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(217 91% 55%)"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  dot={{ r: 3, fill: "hsl(217 91% 55%)" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {!isPremium && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => {}}>
              Premium
            </span>{" "}
            — 6-Monats-Trend freischalten
          </p>
        )}
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />{t("dashboard.insights")}
        </h2>
        {monthData.count === 0 ? (
          <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">Wusstest du?</div>
                <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{randomFact}</p>
              </div>
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {insights.map((ins, i) => (
              <li key={i} className="text-sm text-foreground/80 p-3 bg-secondary rounded-lg">{ins}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Premium Insights */}
      <PremiumGate
        title={t("premiumInsights.title")}
        preview={
          <div className="space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-2/3" />
            <div className="h-4 bg-secondary rounded w-1/2" />
          </div>
        }
      >
        <Card className="p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {t("premiumInsights.title")}
            <PremiumBadge />
          </h2>
          {!premiumInsights ? (
            <p className="text-sm text-muted-foreground mt-3">{t("premiumInsights.noData")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              <li className="text-sm p-3 bg-secondary rounded-lg">
                {t("premiumInsights.forecast", { amount: premiumInsights.forecast.toFixed(0) })}
              </li>
              {premiumInsights.top && (
                <li className="text-sm p-3 bg-secondary rounded-lg">
                  {t("premiumInsights.topCategory", { cat: premiumInsights.top[0], percent: premiumInsights.topPct })}
                </li>
              )}
              <li className="text-sm p-3 bg-secondary rounded-lg">
                {t("premiumInsights.avgDaily", { amount: premiumInsights.avgDaily.toFixed(2) })}
              </li>
              <li className="text-sm p-3 bg-secondary rounded-lg">
                {t("premiumInsights.trend", { trend: premiumInsights.trend })}
              </li>
            </ul>
          )}
        </Card>
      </PremiumGate>

      {/* AI Coach (Premium) */}
      <PremiumGate
        title={t("aiCoach.title")}
        description={t("aiCoach.subtitle")}
        preview={
          <div className="space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-2/3" />
            <div className="h-4 bg-secondary rounded w-4/5" />
          </div>
        }
      >
        <AICoachCard
          summary={`Monatsbudget: € ${budget.toFixed(0)}\nEinnahmen: € ${monthData.income.toFixed(0)}\nAusgaben: € ${monthData.expenses.toFixed(0)}\nVerfügbar: € ${remaining.toFixed(0)}\nSparziel: € ${savingsGoal.toFixed(0)} (${savingsPct}% erreicht)\nAusgaben pro Kategorie: ${Object.entries(monthData.byCat).map(([k, v]) => `${k}: €${v.toFixed(0)}`).join(", ") || "keine"}\nAnzahl Transaktionen: ${monthData.count}`}
          disabled={monthData.count === 0}
        />
      </PremiumGate>

      {/* Deadlines */}
      <Card className="p-6">
        <h2 className="font-semibold">{t("dashboard.upcomingDeadlines")}</h2>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">{t("dashboard.noDeadlines")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deadlines.map((d) => (
              <li key={d.id} className="flex justify-between p-3 bg-secondary rounded-lg text-sm">
                <span className="font-medium">{d.title}</span>
                <span className="text-muted-foreground tabular-nums">{new Date(d.due_date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Dezenter Glass Button — fest oben rechts */}
      <div
        className="fixed right-4 sm:right-6 z-40"
        style={{
          top: "calc(env(safe-area-inset-top) + 0.75rem)",
        }}
      >
        <AddTransactionDialog
          trigger={
            <button
              aria-label="Transaktion hinzufügen"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-xl border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-background/80 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          }
        />
      </div>
    </div>
  );
}
