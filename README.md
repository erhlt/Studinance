# Studinance — lokal nachgebautes Projekt

Dieses Projekt wurde aus den **echten Quelldateien** zusammengebaut, die in deinem Claude-Projekt lagen (40 `.tsx`/`.ts`-Dateien). Es ist **kein** von einer KI aus Prompts neu erfundener Klon — alle Seiten, Komponenten, Hooks und Übersetzungen sind 1:1 deine Originaldateien, eingebettet in ein lauffähiges Vite + React + TypeScript + Tailwind-Gerüst.

`npm install && npm run dev` startet die App, `npm run build` läuft fehlerfrei durch (geprüft).

## Ehrlich gesagt: was ist Original, was ist rekonstruiert?

**1:1 original** (deine echten Dateien, unverändert kopiert):
Alle Seiten (`Dashboard`, `Budget`, `Goals`, `Bafoeg`, `Jobs`, `Marketplace`, `Profile`, `Landing`, `Auth`, `Onboarding`, `Terms`, `Privacy`, `Imprint`, `CheckoutSuccess`, `NotFound`), alle Komponenten (`AddTransactionDialog`, `AppLayout`, `CategoryBudgetsSection`, `DeleteConfirmDialog`, `LanguageSwitcher`, `MonthPicker`, `NavLink`, `PaymentTestModeBanner`, `PremiumGate`, `ProtectedRoute`, `RecurringSection`, `StripeEmbeddedCheckout`), alle Hooks (`useAuth`, `useProfile`, `useTransactions`, `useCategoryBudgets`, `useSavingsGoals`, `useRecurring`, `useRoles`, `use-toast`, `use-mobile`), `categories.ts`, `stripe.ts`, `utils.ts`, `de.ts`/`en.ts`, i18n-Setup.

**Von mir ergänzt, weil im Claude-Projekt nicht vorhanden war** (das Projekt enthielt nur Frontend-Anwendungscode, kein vollständiges Repo):

| Datei/Bereich | Status |
|---|---|
| `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig*.json` | Neu aufgesetzt (Standard-Vite/Tailwind-Setup) |
| `src/components/ui/*` (Button, Card, Dialog, Select, …) | Von Hand nach offiziellem shadcn/Radix-Muster nachgebaut — die shadcn-Registry war in dieser Sandbox nicht erreichbar, daher kein `npx shadcn add`, sondern direkt geschriebener Code nach demselben Open-Source-Pattern |
| `src/index.css` (Farb-Theme, CSS-Variablen) | **Geraten/rekonstruiert.** Dein Original-Theme (Farben, Radius etc.) kannte ich nicht — ich habe ein plausibles blaues Theme passend zu `categories.ts` gebaut. Sieht wahrscheinlich anders aus als dein echtes Design. |
| `src/integrations/supabase/client.ts` | Neu, Standard-Supabase-Client-Boilerplate |
| `src/integrations/lovable/index.ts` | **Rekonstruiert.** Wurde in `Auth.tsx` importiert (`lovable.auth.signInWithOAuth(...)`), war aber nicht in den bereitgestellten Dateien. Das war ursprünglich ein von der Lovable.dev-Plattform injizierter Helper. Ich habe einen funktionsgleichen Wrapper um `supabase.auth.signInWithOAuth` gebaut. |
| `src/components/AICoachCard.tsx` | **Komplett neu erfunden.** Wurde in `Dashboard.tsx` importiert, war aber nirgends im Projekt enthalten. Ich habe sie anhand der Props (`summary`, `disabled`) und der `aiCoach.*`-Übersetzungsschlüssel rekonstruiert. Ruft eine Edge Function `ai-coach` auf, die es noch nicht gibt (siehe unten). |
| `src/assets/studinance-*.webp` | **Platzhalter-Logos**, nicht deine echten Markenbilder (die waren nicht im Projekt enthalten) |
| `supabase/schema.sql` | **Aus den Hooks abgeleitetes Datenbankschema** (Tabellennamen/Spalten stammen direkt aus den `.from("...")`-Aufrufen), inkl. RLS-Policies. Das ist meine beste Rekonstruktion, **nicht** dein echtes Schema — Indizes, Constraints, evtl. zusätzliche Spalten können abweichen. |
| `App.tsx`, `main.tsx`, Routing | Rekonstruiert aus den Nav-Items in `AppLayout.tsx` und den Redirect-Logiken in `ProtectedRoute.tsx`/`Onboarding.tsx` |

## Was komplett fehlt und noch gebaut werden muss

Diese Teile gab es im Original ganz offensichtlich (sie werden aus dem Frontend heraus aufgerufen), waren aber nie Teil der bereitgestellten Dateien — das sind **Supabase Edge Functions**, die du selbst schreiben musst:

- `create-checkout` — wird von `StripeEmbeddedCheckout.tsx` aufgerufen, muss eine Stripe-Checkout-Session erzeugen und `{ clientSecret }` zurückgeben
- `check-subscription` — wird von `CheckoutSuccess.tsx` aufgerufen, muss den Stripe-Abo-Status mit Supabase synchronisieren
- `ai-coach` — von der rekonstruierten `AICoachCard.tsx` aufgerufen, müsste einen LLM-Call machen und `{ tips }` zurückgeben

Außerdem fehlt: das **echte Farb-/Design-Theme**, die **echten Logo-Assets**, und ein Stripe-Produkt/Preis (`priceId`) wird in `Profile.tsx` erwartet — schau dort nach, welche Price-ID übergeben wird.

## Setup

```bash
npm install
cp .env.example .env   # dann VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PAYMENTS_CLIENT_TOKEN eintragen
npm run dev
```

Supabase-Schema einspielen: Inhalt von `supabase/schema.sql` im Supabase SQL-Editor deines Projekts ausführen (oder per Supabase CLI).

## Sinnvolle nächste Schritte mit Claude Code

Wenn du jetzt in VS Code mit Claude Code weitermachst, sind das die Prompts, die wirklich etwas bringen — weil sie auf Lücken zielen, die ich dir oben ehrlich benannt habe (nicht auf Dinge, die schon funktionieren):

1. **Design-Theme angleichen**: "Schau dir `src/index.css` an und die Komponenten, die `bg-secondary`, `shadow-[var(--shadow-card)]` und `--shadow-elevated` benutzen. Ich möchte das Farbschema auf [deine gewünschten Farben/Screenshot] anpassen."
2. **create-checkout Edge Function**: "Erstelle eine Supabase Edge Function `create-checkout` in `supabase/functions/create-checkout/index.ts`, die einen Stripe Embedded Checkout mit `priceId`, `returnUrl` und `environment` aus dem Request-Body erzeugt und `{ clientSecret }` zurückgibt. Nutze die Stripe Secret Keys aus den Supabase Function Secrets."
3. **check-subscription Edge Function**: "Erstelle eine Supabase Edge Function `check-subscription`, die für den eingeloggten User den Stripe-Abo-Status abfragt und in `user_roles` die Rolle `premium` setzt/entfernt."
4. **ai-coach Edge Function**: "Erstelle eine Supabase Edge Function `ai-coach`, die `{ summary: string }` entgegennimmt, an die Anthropic/OpenAI API schickt und `{ tips: string }` mit personalisierten Finanztipps zurückgibt. Berücksichtige Rate-Limiting (429) und Budget-Limits (402), siehe `aiCoach.rateLimit`/`aiCoach.creditsOut` in `src/locales/de.ts`."
5. **Echte Assets einsetzen**: "Ersetze `src/assets/studinance-logo.webp` und `src/assets/studinance-header.webp` durch [Datei], die ich gerade hochgeladen habe."
6. **Bundle-Größe optimieren**: "Der Production-Build hat eine Warnung wegen eines 1.2 MB großen JS-Chunks. Richte Code-Splitting per Route mit `React.lazy` in `App.tsx` ein."

## Bekannte Kleinigkeit

In `Profile.tsx` zeigt `returnUrl` nach dem Checkout auf `/app/profile?checkout=success`, obwohl es eine eigene `CheckoutSuccess`-Seite gibt (hier unter `/app/checkout-success` eingebunden). Das war schon in den Originaldateien so — eventuell bewusst, eventuell ein Rest aus einer früheren Version. Prüf das einmal, falls die Success-Seite nie angezeigt wird.
