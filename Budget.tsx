import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTransactions } from "@/hooks/useTransactions";
import { useProfile } from "@/hooks/useProfile";
import { useRoles } from "@/hooks/useRoles";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { MonthPicker } from "@/components/MonthPicker";
import { PremiumGate } from "@/components/PremiumGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Transaction } from "@/hooks/useTransactions";
import { CategoryBudgetsSection } from "@/components/CategoryBudgetsSection";
import { RecurringSection } from "@/components/RecurringSection";

function exportCsv(transactions: Transaction[], month: string) {
  const rows = transactions.filter((tx) => tx.occurred_on.startsWith(month));
  const header = "Datum,Typ,Kategorie,Betrag,Notiz";
  const lines = rows.map(
    (tx) => `${tx.occurred_on},${tx.type},${tx.category},${tx.amount},"${(tx.note ?? "").replace(/"/g, '""')}"`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studinance-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Budget() {
  const { t } = useTranslation();
  const { transactions, loading, refresh } = useTransactions();
  useProfile();
  const { isPremium } = useRoles();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const monthTx = transactions.filter((tx) => tx.occurred_on.startsWith(selectedMonth));

  const distribution = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter((tx) => tx.type === "expense").forEach((tx) => {
      map[tx.category] = (map[tx.category] ?? 0) + Number(tx.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? "#999" }));
  }, [monthTx]);

  const trend = useMemo(() => {
    const days: Record<string, number> = {};
    monthTx.filter((tx) => tx.type === "expense").forEach((tx) => {
      const d = tx.occurred_on.slice(8, 10);
      days[d] = (days[d] ?? 0) + Number(tx.amount);
    });
    return Object.entries(days)
      .sort()
      .map(([day, amount]) => ({ day, amount }));
  }, [monthTx]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("budget.deleted"));
      refresh();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("budget.title")}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <AddTransactionDialog onSaved={refresh} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">{t("budget.distribution")}</h2>
          {distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{t("budget.noTransactions")}</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={2}>
                      {distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `€ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {distribution.map((d) => {
                  const Icon = CATEGORY_ICONS[d.name];
                  return (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      {Icon && <Icon className="w-3 h-3 shrink-0" style={{ color: d.color }} />}
                      <span className="truncate">{t(`categories.${d.name}`)}</span>
                      <span className="ml-auto text-muted-foreground tabular-nums">€ {d.value.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">{t("budget.overview")}</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">{t("budget.noTransactions")}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`€ ${v.toFixed(2)}`, t("budget.expense")]}
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="hsl(217 91% 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CategoryBudgetsSection monthTx={monthTx} />
        <RecurringSection onChanged={refresh} />
      </div>

      {/* CSV Export — premium only */}
      {isPremium ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(transactions, selectedMonth)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {t("budget.exportCsv")}
          </Button>
        </div>
      ) : (
        <PremiumGate
          title={t("budget.exportCsv")}
          description={t("budget.exportCsvDesc")}
          preview={
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="text-sm">{t("budget.exportCsv")}</span>
            </div>
          }
        />
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">{t("budget.recent")}</h2>
        {loading ? (
          <ul className="divide-y">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-secondary rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-1/3" />
                </div>
                <div className="h-4 bg-secondary rounded animate-pulse w-16" />
              </li>
            ))}
          </ul>
        ) : monthTx.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("budget.noTransactions")}</p>
        ) : (
          <ul className="divide-y">
            {monthTx.slice(0, 50).map((tx) => {
              const Icon = CATEGORY_ICONS[tx.category] ?? CATEGORY_ICONS.other;
              const color = CATEGORY_COLORS[tx.category] ?? "#999";
              return (
                <li key={tx.id} className="py-3 flex items-center gap-3 group">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: color + "22", color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {t(`categories.${tx.category}`)}
                      {tx.note ? <span className="text-muted-foreground font-normal"> · {tx.note}</span> : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.occurred_on).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-semibold text-sm tabular-nums ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "−"} € {Number(tx.amount).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <AddTransactionDialog transaction={tx} onSaved={refresh} />
                    <DeleteConfirmDialog
                      description={t("deleteConfirm.descTransaction")}
                      onConfirm={() => remove(tx.id)}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("budget.delete")}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Mobile FAB */}
      <div className="sm:hidden fixed bottom-24 right-4 z-20">
        <AddTransactionDialog onSaved={refresh} />
      </div>
    </div>
  );
}
