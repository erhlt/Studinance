import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  ready: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  ready: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initialised = false;
    let isMounted = true;
    let recoveryTimer: number | null = null;

    // Only swap the user object reference when the user *identity* changes.
    // Supabase emits TOKEN_REFRESHED / SIGNED_IN events frequently on mobile
    // (tab focus, app resume) with a new user object but same id. Without this
    // guard, every dependent hook (useTransactions, useProfile, useRoles, ...)
    // would refetch on each event, causing the page to look like it's
    // constantly reloading itself.
    const applySession = (newSession: Session | null, markReady: boolean) => {
      if (!isMounted) return;

      setSession((prev) => {
        const prevUserId = prev?.user?.id ?? null;
        const nextUserId = newSession?.user?.id ?? null;

        // Ignore token-only session churn so mobile focus/refresh events do not
        // re-render the entire authenticated app tree over and over.
        if (prevUserId === nextUserId) return prev;

        return newSession;
      });
      setUser((prev) => {
        const next = newSession?.user ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
      });
      // Only flip `loading` to false once we've actually heard back from
      // Supabase about the persisted session — otherwise dependent hooks
      // (useProfile etc.) run a refresh against `user=null` and the
      // ProtectedRoute briefly redirects to /onboarding on mobile where
      // the storage read is a tick slower.
      if (markReady) {
        initialised = true;
        setReady(true);
        setLoading(false);
      }
    };

    const syncSession = async ({ markReady = true, allowRetry = false }: { markReady?: boolean; allowRetry?: boolean } = {}) => {
      const { data: { session: restoredSession } } = await supabase.auth.getSession();

      if (restoredSession || !allowRetry) {
        applySession(restoredSession, markReady);
        return;
      }

      if (recoveryTimer) {
        window.clearTimeout(recoveryTimer);
      }

      recoveryTimer = window.setTimeout(() => {
        void syncSession({ markReady: true, allowRetry: false });
      }, 350);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // The very first auth event on mobile is sometimes INITIAL_SESSION
      // with a null session (storage hasn't been read yet). Don't treat
      // that as "ready" — wait for getSession() below.
      applySession(newSession, initialised || !!newSession);
    });

    void syncSession({ markReady: true, allowRetry: true });

    const recoverVisibleSession = () => {
      if (document.visibilityState === "hidden") return;
      void syncSession({ markReady: true, allowRetry: !initialised && !user });
    };

    window.addEventListener("focus", recoverVisibleSession);
    window.addEventListener("pageshow", recoverVisibleSession);
    document.addEventListener("visibilitychange", recoverVisibleSession);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", recoverVisibleSession);
      window.removeEventListener("pageshow", recoverVisibleSession);
      document.removeEventListener("visibilitychange", recoverVisibleSession);
      if (recoveryTimer) {
        window.clearTimeout(recoveryTimer);
      }
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, ready, signOut }),
    [user, session, loading, ready, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);