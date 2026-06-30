import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import headerLogo from "@/assets/studinance-header.webp";

export default function Terms() {
  const sections = [
    {
      title: "1. Geltungsbereich",
      items: [
        "Diese AGB gelten für die Nutzung der Plattform „Studinance\".",
        "Anbieter ist das hinter der Plattform stehende Projektteam (Details im Impressum).",
        "Studinance richtet sich an Verbraucher, insbesondere Studierende.",
      ],
    },
    {
      title: "2. Leistungen",
      items: [
        "Studinance bietet digitale Tools zur Budgetplanung.",
        "Es gibt eine kostenlose Basisversion sowie kostenpflichtige Premium-Abonnements.",
        "Der Funktionsumfang kann jederzeit angepasst werden.",
      ],
    },
    {
      title: "3. Registrierung",
      items: [
        "Die Nutzung setzt ein Nutzerkonto voraus.",
        "Angaben müssen korrekt sein.",
        "Zugangsdaten sind geheim zu halten.",
      ],
    },
    {
      title: "4. Vertragsschluss (Premium)",
      items: [
        "Die Darstellung stellt kein bindendes Angebot dar.",
        "Vertrag kommt zustande durch Klick auf „zahlungspflichtig bestellen\".",
        "Nutzer erhalten eine Bestätigung per E-Mail.",
      ],
    },
    {
      title: "5. Preise & Abonnement",
      items: [
        "Alle Preise sind in Euro inkl. gesetzlicher MwSt. angegeben.",
        "Premium wird als Abonnement angeboten (monatlich/jährlich).",
        "Abos verlängern sich automatisch, wenn sie nicht gekündigt werden.",
      ],
    },
    {
      title: "6. Kündigung",
      items: [
        "Kündigung jederzeit zum Ende der Laufzeit möglich.",
        "Nach Kündigung bleibt Zugang bis Ablauf erhalten.",
      ],
    },
    {
      title: "7. Zahlungsbedingungen",
      items: [
        "Zahlung erfolgt über angebotene Zahlungsmethoden.",
        "Bei Zahlungsverzug kann Zugang gesperrt werden.",
      ],
    },
    {
      title: "8. Widerrufsrecht",
      items: [
        "Verbraucher haben ein gesetzliches Widerrufsrecht (siehe Widerrufsbelehrung).",
      ],
    },
    {
      title: "9. Nutzungsrechte",
      items: [
        "Nur private Nutzung erlaubt. Keine Weitergabe oder kommerzielle Nutzung.",
      ],
    },
    {
      title: "10. Haftung",
      items: [
        "Haftung nur bei Vorsatz/grober Fahrlässigkeit.",
        "Keine Garantie für finanzielle Ergebnisse oder Berechnungen.",
      ],
    },
    {
      title: "11. Verfügbarkeit",
      items: [
        "Keine Garantie auf unterbrechungsfreie Nutzung.",
      ],
    },
    {
      title: "12. Datenschutz",
      items: [
        "Siehe Datenschutzerklärung.",
      ],
    },
    {
      title: "13. Schlussbestimmungen",
      items: [
        "Deutsches Recht gilt.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 sm:px-8 h-16 flex items-center justify-between border-b sticky top-0 bg-background/80 backdrop-blur z-30">
        <Link to="/" className="flex items-center gap-2 hover-lift">
          <img src={headerLogo} alt="Studinance" className="h-8 w-auto" />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Allgemeine Geschäftsbedingungen (AGB)</h1>
        </div>
        <p className="text-muted-foreground mb-8">Stand: Juni 2026</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
              <ul className="space-y-2 text-muted-foreground">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>
        </div>
      </main>
    </div>
  );
}
