import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Budget from "@/pages/Budget";
import Goals from "@/pages/Goals";
import Bafoeg from "@/pages/Bafoeg";
import Jobs from "@/pages/Jobs";
import Marketplace from "@/pages/Marketplace";
import Profile from "@/pages/Profile";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Imprint from "@/pages/Imprint";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/imprint" element={<Imprint />} />

          {/* Protected app shell (AppLayout + nav) */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="budget" element={<Budget />} />
            <Route path="goals" element={<Goals />} />
            <Route path="bafoeg" element={<Bafoeg />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="checkout-success" element={<CheckoutSuccess />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      <Toaster />
      <SonnerToaster richColors position="top-center" />
    </BrowserRouter>
  );
}
