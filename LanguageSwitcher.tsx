import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const toggle = async () => {
    const next = i18n.language.startsWith("de") ? "en" : "de";
    await i18n.changeLanguage(next);
    if (user) {
      await supabase.from("profiles").update({ language: next }).eq("user_id", user.id);
    }
  };

  const isDE = i18n.language.startsWith("de");
  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Switch language">
      <span className="text-base">{isDE ? "🇩🇪" : "🇬🇧"}</span>
      <span className="ml-1 text-xs font-medium uppercase">{isDE ? "DE" : "EN"}</span>
    </Button>
  );
}