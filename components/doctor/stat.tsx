// A big number with a label, used on dashboards.
export function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-serif text-5xl leading-none">{value}</p>
      {note && <p className="mt-2 text-sm text-ink-2">{note}</p>}
    </div>
  );
}
