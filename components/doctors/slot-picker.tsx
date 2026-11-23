"use client";
// Plain list of day buttons and time buttons — no calendar pop-up, so it works
// well with screen readers. Booked times are crossed out AND say "Booked".
import { useState } from "react";
import { formatDateLong, formatMinute } from "@/lib/time";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";

export type Day = { date: string; slots: { minute: number; free: boolean }[] };

export function SlotPicker({ days, value, onChange }: { days: Day[]; value: { date: string; minute: number } | null; onChange: (v: { date: string; minute: number }) => void }) {
  const { lang } = useApp();
  const firstWithSlots = days.find((d) => d.slots.some((s) => s.free))?.date ?? days[0]?.date;
  const [day, setDay] = useState(value?.date ?? firstWithSlots);
  const current = days.find((d) => d.date === day);

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{pick(lang, "Choose a day", "दिन चुनें")}</legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const free = d.slots.filter((s) => s.free).length;
            const dt = new Date(d.date + "T00:00:00Z");
            const selected = d.date === day;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setDay(d.date)}
                aria-pressed={selected}
                aria-label={`${formatDateLong(d.date)}, ${free ? `${free} free slots` : "no free slots"}`}
                className={`flex min-h-16 min-w-16 shrink-0 flex-col items-center justify-center rounded-xl border px-2 text-xs ${selected ? "border-ink bg-ink text-white" : free ? "border-[#cfc9bf] bg-white hover:bg-soft" : "border-dashed border-line bg-soft text-ink-3"}`}
              >
                <span>{dt.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })}</span>
                <span className="text-lg font-semibold">{dt.getUTCDate()}</span>
                <span className="sr-only">{dt.toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" })}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{current ? formatDateLong(current.date) : ""} — {pick(lang, "choose a time", "समय चुनें")}</legend>
        {!current || current.slots.length === 0 ? (
          <p className="rounded-xl bg-soft p-4 text-sm text-ink-2">{pick(lang, "The doctor isn't available this day. Try another day.", "इस दिन डॉक्टर उपलब्ध नहीं। दूसरा दिन चुनें।")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {current.slots.map((s) => {
              const selected = value?.date === current.date && value.minute === s.minute;
              const label = `${formatDateLong(current.date)}, ${formatMinute(s.minute)}, ${s.free ? "available" : "booked"}`;
              return (
                <button
                  key={s.minute}
                  type="button"
                  disabled={!s.free}
                  aria-pressed={selected}
                  aria-label={label}
                  onClick={() => onChange({ date: current.date, minute: s.minute })}
                  className={`min-h-11 rounded-xl px-1 text-sm ${!s.free ? "cursor-not-allowed border border-dashed border-line bg-soft text-ink-3 line-through" : selected ? "bg-ink font-semibold text-white" : "border border-[#cfc9bf] bg-white hover:bg-soft"}`}
                >
                  {formatMinute(s.minute)}
                  {!s.free && <span className="block text-[10px] no-underline">Booked</span>}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
    </div>
  );
}
