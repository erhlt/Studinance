import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecurring, type RecurringTransaction } from "@/hooks/useRecurring";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_ICONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onChanged?: () => void;
}

export function RecurringSection({ onChanged }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { recurring, refresh } = useRecurring();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<string>("rent");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [note, setNote] = useState("");

  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const save = async () => {
    if (!user) return;
    const amt = Number(amount);
    const d = Math.min(28, Math.max(1, Number(day) || 1));
    if (!amt || amt <= 0) return toast.error(t("recurring.invalidAmount"));
    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      type,
      category,
      amount: amt,
      day_of_month: d,
      note: note || null,
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success(t("recurring.saved"));
    setOpen(false);
    setAmount("");
    setNote("");
    setDay("1");
    refresh();
    onChanged?.();
  };

  const toggle = async (r: RecurringTransaction) => {
    await supabase.from("recurring_transactions").update({ active: !r.active }).eq("id", r.id);
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("recurring_transactions").delete().eq("id", id);
    refresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Repeat className="w-4 h-4 text-primary" />
          {t("recurring.title")}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> {t("recurring.add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("recurring.add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("budget.type")}</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as "income" | "expense");
                    setCategory(v === "expense" ? "rent" : "salary");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t("budget.expense")}</SelectItem>
                    <SelectItem value="income">{t("budget.income")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("budget.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("budget.amount")} (€)</Label>
                  <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <Label>{t("recurring.day")}</Label>
                  <Input type="number" min={1} max={28} value={day} onChange={(e) => setDay(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>{t("budget.note")}</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
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

      {recurring.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t("recurring.empty")}</p>
      ) : (
        <ul className="divide-y">
          {recurring.map((r) => {
            const Icon = CATEGORY_ICONS[r.category] ?? CATEGORY_ICONS.other;
            const color = CATEGORY_COLORS[r.category] ?? "#999";
            return (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color + "22", color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t(`categories.${r.category}`)}
                    {r.note ? <span className="text-muted-foreground font-normal"> · {r.note}</span> : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("recurring.everyMonth", { day: r.day_of_month })}
                  </div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${r.type === "income" ? "text-success" : ""}`}>
                  {r.type === "income" ? "+" : "−"} € {Number(r.amount).toFixed(2)}
                </div>
                <Switch checked={r.active} onCheckedChange={() => toggle(r)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(r.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}