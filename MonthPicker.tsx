import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  maxMonth?: string; // defaults to current month
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function MonthPicker({ value, onChange, maxMonth }: MonthPickerProps) {
  const max = maxMonth ?? new Date().toISOString().slice(0, 7);

  const shift = (delta: number) => {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const isAtMax = value >= max;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => shift(-1)}
        aria-label="Vorheriger Monat"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium min-w-[130px] text-center tabular-nums">
        {formatMonthLabel(value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => shift(1)}
        disabled={isAtMax}
        aria-label="Nächster Monat"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
