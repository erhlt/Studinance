import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategoryBudgets } from "@/hooks/useCategoryBudgets";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Lock, Sparkles } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_ICONS, EXPENSE_CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Transaction } from "@/hooks/useTransactions";
import { PremiumBadge } from "./PremiumGate";
import { useNavigate } from "react-router-dom";

const FREE_LIMIT = 2;

interface Props {
  monthTx: Transaction[];
}

export function CategoryBudgetsSection({ monthTx }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = useRoles();
  const { budgets, refresh } = useCategoryBudgets();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("food");
  const [limit, setLimit] = useState("");

  const reachedLimit = !isPremium && budgets.length >= FREE_LIMIT;

  const spendByCat = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter((tx) => tx.type === "expense").forEach((tx) => {
      map[tx.category] = (map[tx.category] ?? 0) + Number(tx.amount);
    });
    return map;
  }, [monthTx]);

  const save = async () => {
    if (!user) return;
    const limitNum = Number(limit);
    if (!limitNum || limitNum <= 0) return toast.error(t("catBudgets.invalidLimit"));
    const { error } = await supabase
      .from("category_budgets")
      .upsert(
        { user_id: user.id, category, monthly_limit: limitNum },
        { onConflict: "user_id,category" }
      );
    if (error) return toast.error(error.message);
    toast.success(t("catBudgets.saved"));
    setOpen(false);
    setLimit("");
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("category_budgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="font-semibold">{t("catBudgets.title")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2" disabled={reachedLimit}>
              <Plus className="w-4 h-4" /> {t("catBudgets.add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("catBudgets.add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("budget.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("catBudgets.limit")}</Label>
                <Input type="number" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={save}>{t("common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t("catBudgets.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const Icon = CATEGORY_ICONS[b.category] ?? CATEGORY_ICONS.other;
            const color = CATEGORY_COLORS[b.category] ?? "#999";
            const spent = spendByCat[b.category] ?? 0;
            const pct = b.monthly_limit > 0 ? Math.min(100, (spent / b.monthly_limit) * 100) : 0;
            const over = spent > b.monthly_limit;
            return (
              <li key={b.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "22", color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium flex-1">{t(`categories.${b.category}`)}</span>
                  <span className={`text-xs tabular-nums ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    € {spent.toFixed(0)} / € {Number(b.monthly_limit).toFixed(0)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(b.id)}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: over ? "hsl(var(--destructive))" : color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reachedLimit && (
        <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-medium inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {t("catBudgets.limitReached")}
            </span>{" "}
            <span className="text-muted-foreground">{t("catBudgets.limitReachedDesc")}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("/app/profile")}>
            <PremiumBadge />
          </Button>
        </div>
      )}
    </Card>
  );
}