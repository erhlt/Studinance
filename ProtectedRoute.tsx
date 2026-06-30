import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AppLayout } from "./AppLayout";

export function ProtectedRoute() {
  const { user, loading: authLoading, ready } = useAuth();
  const { profile, loading: profileLoading, resolved: profileResolved } = useProfile();

  if (authLoading || !ready || (user && (!profileResolved || profileLoading))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Laden…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}