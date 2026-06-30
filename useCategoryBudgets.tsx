import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CategoryBudget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

export function useCategoryBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("category_budgets")
      .select("*")
      .eq("user_id", user.id);
    setBudgets((data ?? []) as CategoryBudget[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { budgets, loading, refresh };
}