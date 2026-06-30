import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSavingsGoals, type SavingsGoal } from "@/hooks/useSavingsGoals";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { PremiumBadge } from "@/components/PremiumGate";
import { Plus, Target, Trash2, Pencil, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FREE_LIMIT = 2;

export default function Goals() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = useRoles();
  const { goals, loading, refresh } = useSavingsGoals();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<SavingsGoal | null>(null);

  const reachedLimit = !isPremium && goals.length >= FREE_LIMIT;

  const handleSave = async (form: { title: string; target: number; current: number; deadline: string }) => {
    if (!user) return;
    if (edit) {
      const { error } = await supabase
        .from("savings_goals")
        .update({
          title: form.title,
          target_amount: form.target,
          current_amount: form.current,
          deadline: form.deadline || null,
        })
        .eq("id", edit.id);
      if (error) return toast.error(error.message);
    } else {
      if (reachedLimit) {
        toast.error(t("goals.limitReached"));
        return;
      }
      const { error } = await supabase.from("savings_goals").insert({
        user_id: user.id,
        title: form.title,
        target_amount: form.target,
        current_amount: form.current,
        deadline: form.deadline || null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success(t("goals.saved"));
    setOpen(false);
    setEdit(null);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("goals.deleted"));
    refresh();
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("goals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <GoalDialog
          open={open}
          setOpen={setOpen}
          edit={edit}
          setEdit={setEdit}
          onSave={handleSave}
          disabled={reachedLimit && !edit}
        />
      </div>

      {!isPremium && (
        <div className="text-xs text-muted-foreground">
          {t("goals.freeUsage", { used: goals.length, max: FREE_LIMIT })}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-10 text-center">
          <Target className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-semibold">{t("goals.empty")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("goals.emptyDesc")}</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
            return (
              <Card key={g.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{g.title}</div>
                    {g.deadline && (
                      <div className="text-xs text-muted-foreground">
                        {t("goals.until")}: {new Date(g.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEdit(g);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <DeleteConfirmDialog
                      description={t("goals.deleteDesc")}
                      onConfirm={() => remove(g.id)}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm tabular-nums">
                    <span className="font-medium">€ {Number(g.current_amount).toFixed(0)}</span>
                    <span className="text-muted-foreground">€ {Number(g.target_amount).toFixed(0)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{Math.round(pct)}%</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {reachedLimit && (
        <Card className="p-6 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("goals.unlimitedTitle")}
                <PremiumBadge />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{t("goals.unlimitedDesc")}</p>
              <Button size="sm" className="mt-3" onClick={() => navigate("/app/profile")}>
                {t("premiumGate.cta")}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function GoalDialog({
  open,
  setOpen,
  edit,
  setEdit,
  onSave,
  disabled,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  edit: SavingsGoal | null;
  setEdit: (g: SavingsGoal | null) => void;
  onSave: (form: { title: string; target: number; current: number; deadline: string }) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  const sync = (g: SavingsGoal | null) => {
    setTitle(g?.title ?? "");
    setTarget(g ? String(g.target_amount) : "");
    setCurrent(g ? String(g.current_amount) : "0");
    setDeadline(g?.deadline ?? "");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) sync(edit);
        else setEdit(null);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} className="gap-2">
          <Plus className="w-4 h-4" /> {t("goals.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? t("goals.edit") : t("goals.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("goals.titleLabel")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("goals.titlePlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("goals.target")}</Label>
              <Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <Label>{t("goals.current")}</Label>
              <Input type="number" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("goals.deadlineOptional")}</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() =>
              onSave({
                title: title.trim(),
                target: Number(target) || 0,
                current: Number(current) || 0,
                deadline,
              })
            }
            disabled={!title.trim() || Number(target) <= 0}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}