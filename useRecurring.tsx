import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string | null;
  day_of_month: number;
  active: boolean;
  last_run_month: string | null;
  created_at: string;
}

/**
 * Loads recurring transactions and auto-applies any that are due
 * for the current month (one-shot per month, idempotent via last_run_month).
 */
export function useRecurring() {
  const { user } = useAuth();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRecurring([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const list = (data ?? []) as RecurringTransaction[];

    // Auto-apply due ones
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const today = now.getDate();
    for (const r of list) {
      if (!r.active) continue;
      if (r.last_run_month === ym) continue;
      if (r.day_of_month > today) continue;
      const occurredOn = `${ym}-${String(Math.min(r.day_of_month, 28)).padStart(2, "0")}`;
      const { error: insErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: r.type,
        category: r.category,
        amount: r.amount,
        note: r.note ? `🔁 ${r.note}` : "🔁 Wiederkehrend",
        occurred_on: occurredOn,
      });
      if (!insErr) {
        await supabase
          .from("recurring_transactions")
          .update({ last_run_month: ym })
          .eq("id", r.id);
      }
    }

    setRecurring(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { recurring, loading, refresh };
}