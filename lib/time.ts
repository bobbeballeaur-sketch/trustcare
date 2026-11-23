// Date and time helpers. All appointment times are in India time (Asia/Kolkata).

export const SLOT_MINUTES = 15;
export const BOOKING_WINDOW_DAYS = 14;
const IST_OFFSET_MIN = 330; // India is UTC+5:30

/** Current date and minute-of-day in India. */
export function nowInIndia(): { date: string; minute: number; dayOfWeek: number } {
  const now = new Date(Date.now() + IST_OFFSET_MIN * 60_000);
  const date = now.toISOString().slice(0, 10);
  return { date, minute: now.getUTCHours() * 60 + now.getUTCMinutes(), dayOfWeek: now.getUTCDay() };
}

/** Add days to a YYYY-MM-DD string. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeek(date: string): number {
  return new Date(date + "T00:00:00Z").getUTCDay();
}

/** 615 -> "10:15 am" */
export function formatMinute(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "10:15" -> 615 */
export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 615 -> "10:15" (for <input type="time">) */
export function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function dayName(dow: number) {
  return DAY_NAMES[dow];
}

/** "2026-11-25" -> "Wednesday 25 November" */
export function formatDateLong(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "2026-11-25" -> "Wed 25 Nov" */
export function formatDateShort(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return `${DAY_NAMES[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}

/** Minutes from now until a slot starts (negative = in the past). */
export function minutesUntil(date: string, startMinute: number): number {
  const slot = Date.parse(date + "T00:00:00Z") + (startMinute - IST_OFFSET_MIN) * 60_000;
  return Math.round((slot - Date.now()) / 60_000);
}

type Block = { dayOfWeek: number; startMinute: number; endMinute: number };
type LeaveRange = { fromDate: string; toDate: string };
type Taken = { date: string; startMinute: number };

/**
 * Free 15-minute slots for the next N days:
 * weekly hours, minus leave days, minus booked slots, minus the past.
 */
export function generateSlots(
  blocks: Block[],
  leaves: LeaveRange[],
  taken: Taken[],
  days = BOOKING_WINDOW_DAYS,
): { date: string; slots: { minute: number; free: boolean }[] }[] {
  const { date: today, minute: nowMin } = nowInIndia();
  const takenSet = new Set(taken.map((t) => `${t.date}|${t.startMinute}`));
  const result: { date: string; slots: { minute: number; free: boolean }[] }[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const onLeave = leaves.some((l) => date >= l.fromDate && date <= l.toDate);
    const dow = dayOfWeek(date);
    const slots: { minute: number; free: boolean }[] = [];
    if (!onLeave) {
      for (const b of blocks.filter((x) => x.dayOfWeek === dow).sort((a, b) => a.startMinute - b.startMinute)) {
        for (let m = b.startMinute; m + SLOT_MINUTES <= b.endMinute; m += SLOT_MINUTES) {
          if (date === today && m <= nowMin + 30) continue; // past or too soon
          slots.push({ minute: m, free: !takenSet.has(`${date}|${m}`) });
        }
      }
    }
    result.push({ date, slots });
  }
  return result;
}
