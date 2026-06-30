# Studinance

Finanz- und Budget-App für Studierende. Verwaltet Einnahmen, Ausgaben,
Budgets pro Kategorie, Sparziele und wiederkehrende Buchungen, inkl.
Premium-Funktionen über Stripe.

## Tech-Stack
- React + TypeScript + Vite
- Tailwind CSS, shadcn/ui (Radix)
- Supabase (Auth + Datenbank)
- Stripe (Zahlungen)
- i18next (Deutsch/Englisch)

## Setup
```bash
npm install
cp .env.example .env   # Supabase- und Stripe-Keys eintragen
npm run dev
```

Datenbankschema befindet sich in `supabase/schema.sql`.
