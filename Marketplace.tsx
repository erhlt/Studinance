import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Lock, BookOpen, Home, Sofa, Package } from "lucide-react";

const NOTIFY_KEY = "studinance_marketplace_email";

const PREVIEW_ITEMS = [
  { icon: Home, category: "WG-Zimmer", title: "WG-Zimmer frei ab Mai", price: "520 €/Mo.", location: "Berlin", color: "hsl(217 91% 55%)" },
  { icon: Sofa, category: "Möbel", title: "IKEA Kallax Regal weiß", price: "45 €", location: "München", color: "hsl(38 92% 50%)" },
  { icon: BookOpen, category: "Bücher", title: "Analysis I + II Skripte", price: "8 €", location: "Hamburg", color: "hsl(142 71% 45%)" },
  { icon: Package, category: "Sonstiges", title: "Schreibtischstuhl OVP", price: "30 €", location: "Köln", color: "hsl(280 70% 60%)" },
];

export default function Marketplace() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(NOTIFY_KEY));

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem(NOTIFY_KEY, email);
    setSubmitted(true);
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("marketplace.description")}</p>
      </div>

      {/* Email capture */}
      <Card className="p-6 bg-gradient-primary text-primary-foreground border-0">
        {submitted ? (
          <div className="text-center py-2">
            <div className="text-2xl mb-2">🎉</div>
            <p className="font-semibold">{t("marketplace.notifySuccess")}</p>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-lg">{t("marketplace.comingSoon")}</h2>
            <p className="text-sm opacity-90 mt-1 mb-4">{t("marketplace.notifyDesc")}</p>
            <form onSubmit={handleNotify} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder={t("marketplace.notifyPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/15 border-white/30 placeholder:text-white/60 text-white flex-1"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                {t("marketplace.notify")}
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* Preview listings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold">{t("marketplace.previewTitle")}</h2>
          <Badge variant="secondary" className="text-[10px]">{t("marketplace.previewBadge")}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {PREVIEW_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="relative rounded-2xl border bg-card p-4 overflow-hidden select-none">
                {/* blur overlay */}
                <div className="absolute inset-0 backdrop-blur-[2px] bg-background/40 flex items-center justify-center z-10 rounded-2xl">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-medium">{t("marketplace.comingSoon")}</span>
                  </div>
                </div>
                {/* content underneath */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.color + "22", color: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-[10px] mb-1">{item.category}</Badge>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-bold text-sm">{item.price}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{item.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
