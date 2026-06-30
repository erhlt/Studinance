import { ReactNode } from "react";
import { useRoles } from "@/hooks/useRoles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface Props {
  children?: ReactNode;
  /** If true, shows a blurred preview behind the lock instead of nothing */
  preview?: ReactNode;
  title?: string;
  description?: string;
}

export function PremiumGate({ children, preview, title, description }: Props) {
  const { isPremium, loading } = useRoles();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-24 animate-pulse bg-muted rounded-lg" />;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Card className="p-6 relative overflow-hidden border-primary/20">
      {preview && (
        <div className="absolute inset-0 blur-md opacity-40 pointer-events-none select-none p-6">
          {preview}
        </div>
      )}
      <div className="relative flex flex-col items-center text-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            {title ?? t("premiumGate.title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {description ?? t("premiumGate.description")}
          </p>
        </div>
        <Button onClick={() => navigate("/app/profile")} size="sm">
          {t("premiumGate.cta")}
        </Button>
      </div>
    </Card>
  );
}

/** Inline badge to show a feature is premium-only */
export function PremiumBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <Sparkles className="w-3 h-3" />
      {t("premiumGate.badge")}
    </span>
  );
}
