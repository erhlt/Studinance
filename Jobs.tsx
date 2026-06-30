import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoles } from "@/hooks/useRoles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2, Sparkles, CheckCircle2, Bookmark, BookmarkCheck, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  hourly_wage: number | null;
  remote: boolean;
  description: string | null;
  apply_url: string | null;
  created_at: string;
}

const SAVED_KEY = "studinance_saved_jobs";

function getSaved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function setSaved(set: Set<string>) {
  localStorage.setItem(SAVED_KEY, JSON.stringify([...set]));
}

export default function Jobs() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useProfile();
  const { isPremium } = useRoles();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saved, setSavedState] = useState<Set<string>>(getSaved);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [remote, setRemote] = useState(false);
  const [minWage, setMinWage] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "wage">("newest");

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data ?? []) as Job[]);
        setLoading(false);
      });
    if (user) {
      supabase
        .from("applications")
        .select("job_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setApplied(new Set((data ?? []).map((r: { job_id: string }) => r.job_id)));
        });
    }
  }, [user]);

  const cities = useMemo(() => Array.from(new Set(jobs.map((j) => j.city))).sort(), [jobs]);

  const filtered = useMemo(() => {
    let list = jobs.filter((j) => {
      if (city && j.city !== city) return false;
      if (remote && !j.remote) return false;
      if (minWage && Number(j.hourly_wage ?? 0) < Number(minWage)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
    if (sort === "wage") {
      list = [...list].sort((a, b) => (b.hourly_wage ?? 0) - (a.hourly_wage ?? 0));
    }
    return list;
  }, [jobs, city, remote, minWage, search, sort]);

  const apply = async (job: Job) => {
    if (!user) return;
    if (job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
    }
    if (!applied.has(job.id)) {
      const { error } = await supabase.from("applications").insert({ user_id: user.id, job_id: job.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      setApplied(new Set([...applied, job.id]));
      toast.success(t("jobs.applied"));
    }
  };

  const toggleSave = (id: string) => {
    const next = new Set(saved);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSavedState(next);
    setSaved(next);
  };

  const savedJobs = jobs.filter((j) => saved.has(j.id));

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-8 bg-secondary rounded animate-pulse w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const JobCard = ({ job }: { job: Job }) => (
    <Card key={job.id} className="p-5 card-smooth">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-snug">{job.title}</h3>
            {applied.has(job.id) && (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.city}</span>
            {job.remote && <Badge variant="secondary" className="text-[10px]">{t("jobs.remote")}</Badge>}
          </div>
          {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold tabular-nums">€ {Number(job.hourly_wage ?? 0).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{t("jobs.perHour")}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => toggleSave(job.id)}
          aria-label={saved.has(job.id) ? t("jobs.unsave") : t("jobs.save")}
        >
          {saved.has(job.id)
            ? <><BookmarkCheck className="w-4 h-4 text-primary" />{t("jobs.saved")}</>
            : <><Bookmark className="w-4 h-4" />{t("jobs.save")}</>
          }
        </Button>
        {applied.has(job.id) ? (
          <Button variant="outline" size="sm" disabled>
            <CheckCircle2 className="w-4 h-4 mr-1 text-success" />{t("jobs.applied")}
          </Button>
        ) : (
          <Button size="sm" onClick={() => apply(job)} className="gap-1.5">
            {job.apply_url && <ExternalLink className="w-3.5 h-3.5" />}
            {job.apply_url ? t("jobs.applyNow") : t("jobs.markApplied")}
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t("jobs.title")}</h1>

      {!isPremium && (
        <Card className="p-6 bg-gradient-primary text-primary-foreground border-0">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">{t("jobs.aiMatch")}</h3>
              <p className="text-sm opacity-90 mt-1">{t("jobs.aiMatchDesc")}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("jobs.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("jobs.filterCity")}</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            >
              <option value="">{t("jobs.all")}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("jobs.filterMinWage")} (€)</label>
            <Input type="number" min={0} step={0.5} value={minWage} onChange={(e) => setMinWage(e.target.value)} placeholder="15" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("jobs.sort")}</label>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "wage")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("jobs.sortNewest")}</SelectItem>
                <SelectItem value="wage">{t("jobs.sortHighestWage")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 h-10">
            <Switch checked={remote} onCheckedChange={setRemote} />
            <span className="text-sm">{t("jobs.filterRemote")}</span>
          </label>
        </div>
      </Card>

      {/* Saved jobs section */}
      {savedJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("jobs.savedSection")}</h2>
          {savedJobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length === 1 ? t("jobs.count_one", { count: filtered.length }) : t("jobs.count_other", { count: filtered.length })}
        </p>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t("jobs.noJobs")}</p>}
        {filtered.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  );
}
