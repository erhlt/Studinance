import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import headerLogo from "@/assets/studinance-header.webp";

export default function Privacy() {
  const sections = [
    {
      title: "1. Verantwortlicher",
      items: [
        "Siehe Impressum.",
      ],
    },
    {
      title: "2. Erhobene Daten",
      items: [
        "Registrierungsdaten (E-Mail, Passwort)",
        "Nutzungsdaten (Budgeteinträge etc.)",
        "Zahlungsdaten (bei Premium)",
      ],
    },
    {
      title: "3. Zweck der Verarbeitung",
      items: [
        "Bereitstellung der Plattform",
        "Vertragsabwicklung",
        "Verbesserung der Funktionen",
      ],
    },
    {
      title: "4. Rechtsgrundlagen",
      items: [
        "Art. 6 Abs. 1 lit. b DSGVO (Vertrag)",
        "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)",
      ],
    },
    {
      title: "5. Speicherung",
      items: [
        "Daten werden nur so lange gespeichert, wie es notwendig ist.",
      ],
    },
    {
      title: "6. Weitergabe an Dritte",
      items: [
        "Nur an Zahlungsanbieter und technische Dienstleister.",
      ],
    },
    {
      title: "7. Rechte der Nutzer",
      items: [
        "Auskunft",
        "Löschung",
        "Berichtigung",
        "Einschränkung der Verarbeitung",
      ],
    },
    {
      title: "8. Sicherheit",
      items: [
        "Wir setzen technische Maßnahmen zum Schutz der Daten ein.",
      ],
    },
    {
      title: "9. Änderungen",
      items: [
        "Diese Erklärung kann angepasst werden.",
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
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Datenschutzerklärung</h1>
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
