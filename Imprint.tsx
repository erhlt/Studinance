import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import headerLogo from "@/assets/studinance-header.webp";

export default function Imprint() {
  const sections = [
    {
      title: "Angaben gemäß § 5 TMG",
      items: [
        "Studinance Cooperation GmbH",
        "Sigmaringer Str. 25",
        "70567 Stuttgart",
        "Deutschland",
      ],
    },
    {
      title: "Kontakt",
      items: [
        "Telefon: +49 176 81021145",
        "E-Mail: Info@webstudiocg.de",
      ],
    },
    {
      title: "Vertreten durch",
      items: [
        "Carlos Gabrail",
      ],
    },
    {
      title: "Umsatzsteuer-ID",
      items: [
        "Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: DE6103 7782",
      ],
    },
    {
      title: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
      items: [
        "Carlos Gabrail",
        "Schillerstraße 26, 73033 Göppingen",
      ],
    },
    {
      title: "Haftung für Inhalte",
      items: [
        "Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
      ],
    },
    {
      title: "Haftung für Links",
      items: [
        "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.",
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
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>
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
