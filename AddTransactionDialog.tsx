import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import { Transaction } from "@/hooks/useTransactions";

interface Props {
  onSaved?: () => void;
  trigger?: React.ReactNode;
  transaction?: Transaction;
}

export function AddTransactionDialog({ onSaved, trigger, transaction }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEdit = !!transaction;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("food");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (open && transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setDate(transaction.occurred_on);
      setNote(transaction.note ?? "");
    }
  }, [open, transaction]);

  const reset = () => {
    if (isEdit) return;
    setType("expense");
    setAmount("");
    setCategory("food");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
  };

  const save = async () => {
    if (!user || !amount) return;
    setBusy(true);

    const payload = {
      amount: Number(amount),
      type,
      category,
      note: note || null,
      occurred_on: date,
    };

    const { error } = isEdit
      ? await supabase.from("transactions").update(payload).eq("id", transaction!.id)
      : await supabase.from("transactions").insert({ ...payload, user_id: user.id });

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("budget.saved"));
    setOpen(false);
    reset();
    onSaved?.();
  };

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("budget.editTransaction")}>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  ) : (
    <Button size="lg" className="rounded-full shadow-[var(--shadow-elevated)]">
      <Plus className="w-4 h-4 mr-2" />
      {t("budget.addTransaction")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("budget.editTransaction") : t("budget.addTransaction")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setType("expense"); if (!isEdit) setCategory("food"); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${type === "expense" ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-secondary"}`}
            >
              {t("budget.expense")}
            </button>
            <button
              type="button"
              onClick={() => { setType("income"); if (!isEdit) setCategory("salary"); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${type === "income" ? "border-success bg-success/10 text-success" : "border-border hover:bg-secondary"}`}
            >
              {t("budget.income")}
            </button>
          </div>
          <div className="space-y-2">
            <Label>{t("budget.amount")} (€)</Label>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{t("budget.category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("budget.date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("budget.note")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>{t("budget.cancel")}</Button>
            <Button className="flex-1" onClick={save} disabled={busy || !amount}>{t("budget.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
