import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string | null;
  occurred_on: string;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_on", { ascending: false })
      .limit(500);
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, loading, refresh };
}