import { useEffect, useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Lightbulb, Plus, Trash2, ExternalLink, FileText, Handshake } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["step1", "step2", "step3", "step4"] as const;
const DOCS = ["id", "enrollment", "taxParents", "bankStatement", "rental", "health"] as const;
const TIPS = ["tip1", "tip2", "tip3", "tip4"] as const;

export default function Bafoeg() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [deadlines, setDeadlines] = useState<Array<{ id: string; title: string; due_date: string }>>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const loadChecks = async () => {
    if (!user) return;
    const { data } = await supabase.from("bafoeg_checklist").select("item_key,completed").eq("user_id", user.id);
    const map: Record<string, boolean> = {};
    data?.forEach((r: any) => { map[r.item_key] = r.completed; });
    setChecked(map);
  };

  const loadDeadlines = async () => {
    if (!user) return;
    const { data } = await supabase.from("bafoeg_deadlines").select("id,title,due_date").eq("user_id", user.id).order("due_date");
    setDeadlines(data ?? []);
  };

  useEffect(() => { loadChecks(); loadDeadlines(); }, [user]);

  const toggle = async (key: string) => {
    if (!user) return;
    const next = !checked[key];
    setChecked({ ...checked, [key]: next });
    await supabase.from("bafoeg_checklist").upsert(
      { user_id: user.id, item_key: key, completed: next },
      { onConflict: "user_id,item_key" }
    );
  };

  const addDeadline = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title || !date) return;
    const { error } = await supabase.from("bafoeg_deadlines").insert({ user_id: user.id, title, due_date: date });
    if (error) toast.error(error.message);
    else {
      setOpen(false); setTitle(""); setDate(""); loadDeadlines();
    }
  };

  const removeDeadline = async (id: string) => {
    await supabase.from("bafoeg_deadlines").delete().eq("id", id);
    loadDeadlines();
  };

  const completedSteps = DOCS.filter((d) => checked[d]).length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("bafoeg.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("bafoeg.subtitle")}</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-1">{t("bafoeg.applyTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("bafoeg.applySubtitle")}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href="https://www.bafoeg-digital.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-4 rounded-xl border bg-card hover:border-primary hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{t("bafoeg.officialTitle")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("bafoeg.officialDesc")}</p>
              <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wide text-primary">
                {t("bafoeg.officialBadge")}
              </span>
            </div>
          </a>

          <a
            href="https://www.meinbafoeg.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-4 rounded-xl border bg-card hover:border-primary hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Handshake className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{t("bafoeg.partnerTitle")}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("bafoeg.partnerDesc")}</p>
              <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wide text-accent">
                {t("bafoeg.partnerBadge")}
              </span>
            </div>
          </a>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">{t("bafoeg.steps")}</h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-4 p-3 bg-secondary rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
              <div>
                <div className="font-medium">{t(`bafoeg.${s}`)}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{t(`bafoeg.${s}Desc`)}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("bafoeg.checklist")}</h2>
          <span className="text-xs text-muted-foreground">{completedSteps} / {DOCS.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {DOCS.map((d) => (
            <label key={d} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary">
              <Checkbox checked={!!checked[d]} onCheckedChange={() => toggle(d)} />
              <span className={`text-sm ${checked[d] ? "line-through text-muted-foreground" : ""}`}>{t(`bafoeg.docs.${d}`)}</span>
              {checked[d] && <CheckCircle2 className="w-4 h-4 text-success ml-auto" />}
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("bafoeg.deadlines")}</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />{t("bafoeg.addDeadline")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("bafoeg.addDeadline")}</DialogTitle></DialogHeader>
              <form onSubmit={addDeadline} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("bafoeg.deadlineTitle")}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("bafoeg.deadlineDate")}</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">{t("common.save")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.noDeadlines")}</p>
        ) : (
          <ul className="space-y-2">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(d.due_date).toLocaleDateString()}</div>
                </div>
                <DeleteConfirmDialog
                  description={t("deleteConfirm.descDeadline")}
                  onConfirm={() => removeDeadline(d.id)}
                  trigger={
                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Lightbulb className="w-4 h-4 text-warning" />{t("bafoeg.tips")}</h2>
        <ul className="space-y-2">
          {TIPS.map((tip) => (
            <li key={tip} className="text-sm p-3 bg-warning/5 border border-warning/20 rounded-lg">{t(`bafoeg.${tip}`)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}