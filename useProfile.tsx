import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTranslation } from "react-i18next";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  hochschule: string | null;
  semester: number | null;
  bafoeg_status: string | null;
  language: string | null;
  monthly_budget: number | null;
  savings_goal: number | null;
  onboarding_completed: boolean | null;
  premium_until: string | null;
}

export function useProfile() {
  const { user, ready } = useAuth();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedUserId = useRef<string | null>(null);
  const creatingProfileForUserId = useRef<string | null>(null);
  const activeRequestId = useRef(0);
  const profileRef = useRef<Profile | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!ready) {
      setLoading(true);
      setResolved(false);
      return;
    }

    if (!user) {
      activeRequestId.current += 1;
      lastLoadedUserId.current = null;
      creatingProfileForUserId.current = null;
      setProfile(null);
      setError(null);
      setLoading(false);
      setResolved(true);
      return;
    }

    // Allow callers (save, post-checkout, realtime updates) to force a real
    // refetch instead of returning the cached profile.
    if (!options?.force && lastLoadedUserId.current === user.id && profileRef.current) {
      setLoading(false);
      setResolved(true);
      return;
    }

    const requestId = activeRequestId.current + 1;
    activeRequestId.current = requestId;
    setLoading(true);
    setResolved(false);
    setError(null);

    try {
      let { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data && creatingProfileForUserId.current !== user.id) {
        creatingProfileForUserId.current = user.id;

        const fallbackDisplayName =
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          null;

        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: fallbackDisplayName,
            language: i18n.resolvedLanguage ?? i18n.language,
          })
          .select("*")
          .single();

        if (!insertError) {
          data = insertedProfile;
        } else {
          const { data: retriedProfile, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (retryError) {
            throw retryError;
          }

          data = retriedProfile;
        }

        creatingProfileForUserId.current = null;
      }

      if (requestId !== activeRequestId.current) return;

      lastLoadedUserId.current = user.id;
      setProfile((data ?? null) as Profile | null);
      if (data?.language && data.language !== i18n.language) {
        void i18n.changeLanguage(data.language);
      }
    } catch (err) {
      if (requestId !== activeRequestId.current) return;

      lastLoadedUserId.current = user.id;
      setProfile(null);
      setError(err instanceof Error ? err.message : "Profil konnte nicht geladen werden.");
    } finally {
      if (creatingProfileForUserId.current === user.id) {
        creatingProfileForUserId.current = null;
      }

      if (requestId === activeRequestId.current) {
        setLoading(false);
        setResolved(true);
      }
    }
  }, [ready, user, i18n]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const missing = !!user && resolved && !loading && !profile;

  return { profile, loading, resolved, missing, error, refresh };
}