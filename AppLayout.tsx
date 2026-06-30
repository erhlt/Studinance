import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Wallet, Target, GraduationCap, Briefcase, ShoppingBag, User } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { cn } from "@/lib/utils";
import headerLogo from "@/assets/studinance-header.webp";
import logo from "@/assets/studinance-logo.webp";

const navItems = [
  { to: "/app", key: "dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/budget", key: "budget", icon: Wallet },
  { to: "/app/goals", key: "goals", icon: Target },
  { to: "/app/bafoeg", key: "bafoeg", icon: GraduationCap },
  { to: "/app/jobs", key: "jobs", icon: Briefcase },
  { to: "/app/marketplace", key: "marketplace", icon: ShoppingBag },
  { to: "/app/profile", key: "profile", icon: User },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentNav = navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="flex h-dvh w-full max-w-full flex-col overflow-hidden bg-background">
      <PaymentTestModeBanner />
      <div className="flex min-h-0 min-w-0 flex-1 w-full max-w-full overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 min-h-0 shrink-0 flex-col overflow-hidden border-r bg-card">
        <div className="shrink-0 border-b p-6">
          <NavLink to="/app" className="flex items-center gap-2 hover-lift">
            <img src={headerLogo} alt="Studinance" className="h-8 w-auto" />
          </NavLink>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-foreground hover:bg-secondary hover:translate-x-0.5"
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {t(`nav.${item.key}`)}
              </NavLink>
            );
          })}
        </nav>
        <div className="shrink-0 border-t p-3">
          <LanguageSwitcher />
        </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(3.5rem + env(safe-area-inset-top))",
          }}
        >
          <div className="flex items-center gap-2">
            <img src={logo} alt="Studinance" className="h-7 w-7 rounded-md" />
            <span className="font-semibold">{currentNav ? t(`nav.${currentNav.key}`) : t("app.name")}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <main
          key={location.pathname}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0"
        >
          {children}
          <footer className="px-4 sm:px-8 py-6 mt-4 border-t">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Studinance</span>
              <div className="flex items-center gap-4">
                <Link to="/terms" className="hover:text-foreground transition-colors">AGB</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
                <Link to="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
              </div>
            </div>
          </footer>
        </main>

        {/* Bottom nav mobile */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-7 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 text-[10px] transition-all duration-200 ease-out",
                      isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="leading-none">{t(`nav.${item.key}`)}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
        </div>
      </div>
    </div>
  );
}