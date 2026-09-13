"use client";

import { useEffect, useState } from "react";
import { timeTogether } from "@/lib/dates";

export function LiveCounter({ startDate }: { startDate: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const t = timeTogether(startDate, now);
  const parts = [
    [t.years, "anos"],
    [t.months, "meses"],
    [t.days, "dias"],
    [t.hours, "horas"],
    [t.minutes, "min"],
    [t.seconds, "seg"],
  ] as const;

  return (
    <p className="text-[11px] tracking-wide text-white/80 sm:text-xs">
      {parts.map(([value, label], index) => (
        <span key={label}>
          <span className="tabular-nums font-semibold text-white">{value}</span> {label}
          {index < parts.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}
