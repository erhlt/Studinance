import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  /** Plain-text summary of the user's current month, sent to the AI coach edge function */
  summary: string;
  disabled?: boolean;
}

/**
 * NOTE: This component was imported in Dashboard.tsx ("@/components/AICoachCard")
 * but was not part of the available source files, so it's reconstructed here
 * based on its usage (props: summary, disabled) and the aiCoach.* translation
 * keys in de.ts / en.ts. It expects a Supabase Edge Function called "ai-coach"
 * that takes { summary } and returns { tips: string } — this function still
 * needs to be created (see README "Fehlende Backend-Teile").
 */
export function AICoachCard({ summary, disabled }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askCoach = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-coach", {
        body: { summary },
      });
      if (fnError) {
        const status = (fnError as { context?: { status?: number } }).context?.status;
        if (status === 429) setError(t("aiCoach.rateLimit"));
        else if (status === 402) setError(t("aiCoach.creditsOut"));
        else setError(t("aiCoach.error"));
        return;
      }
      setTips(data?.tips ?? null);
    } catch {
      setError(t("aiCoach.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      {tips ? (
        <p className="text-sm whitespace-pre-line">{tips}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("aiCoach.hint")}</p>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      <Button onClick={askCoach} disabled={disabled || loading} className="mt-4" size="sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {t("aiCoach.ask")}
      </Button>
    </Card>
  );
}
