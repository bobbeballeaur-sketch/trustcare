"use client";
// One reusable table for every admin page: search, column sorting, filters
// and pagination (10 per page). On phones each row becomes a stacked card.
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  /** Plain value for the CSV export (defaults to sortValue). */
  csv?: (row: T) => string | number;
};

/** Downloads the rows currently shown by the filters as a CSV file (opens in Excel). */
function exportCsv<T>(rows: T[], columns: Column<T>[], name: string) {
  const cols = columns.filter((c) => c.csv || c.sortValue);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.map((c) => esc(c.header)).join(","), ...rows.map((r) => cols.map((c) => esc((c.csv ?? c.sortValue)!(r))).join(","))];
  const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `trustcare-${name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
export type FilterDef<T> = { key: string; label: string; options: string[]; value: (row: T) => string };

export function DataTable<T extends { id: string }>({
  rows, columns, searchText, filters = [], caption, pageSize = 10, empty = "Nothing to show.",
}: {
  rows: T[];
  columns: Column<T>[];
  searchText: (row: T) => string;
  filters?: FilterDef<T>[];
  caption: string;
  pageSize?: number;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => searchText(r).toLowerCase().includes(q.toLowerCase()));
    for (const def of filters) if (f[def.key]) out = out.filter((r) => def.value(r) === f[def.key]);
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) out = [...out].sort((a, b) => { const x = col.sortValue!(a), y = col.sortValue!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
    }
    return out;
  }, [rows, q, f, sort, filters, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const toggle = (key: string) => { setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 })); setPage(1); };
  const input = "h-11 rounded-xl border border-[#cfc9bf] bg-white px-3 text-sm";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3" role="search" aria-label={`Filter ${caption}`}>
        <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-medium">Search
          <span className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-ink-2" aria-hidden="true" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={`${input} w-full pl-9 font-normal`} />
          </span>
        </label>
        {filters.map((def) => (
          <label key={def.key} className="flex flex-col gap-1 text-sm font-medium">{def.label}
            <select value={f[def.key] ?? ""} onChange={(e) => { setF({ ...f, [def.key]: e.target.value }); setPage(1); }} className={`${input} font-normal`}>
              <option value="">All</option>
              {def.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <p role="status" className="pb-3 text-sm text-ink-2">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        <button type="button" onClick={() => exportCsv(filtered, columns, caption)} className="ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-[#cfc9bf] bg-white px-4 text-sm font-medium hover:bg-soft">
          <Download size={16} aria-hidden="true" /> Export CSV
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-soft text-ink-2">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className="px-4 py-3 font-medium">
                  {c.sortValue ? (
                    <button type="button" onClick={() => toggle(c.key)} className="inline-flex min-h-9 items-center gap-1 hover:text-ink">
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 1 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />) : <ArrowUpDown size={14} aria-hidden="true" className="opacity-50" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((r) => (
              <tr key={r.id} className="align-top">
                {columns.map((c) => <td key={c.key} className="px-4 py-3.5">{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-6 text-ink-2">{empty}</p>}
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {visible.map((r) => (
          <li key={r.id} className="rounded-3xl border border-line bg-white p-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              {columns.map((c) => (
                <div key={c.key} className="contents"><dt className="text-ink-2">{c.header}</dt><dd>{c.render(r)}</dd></div>
              ))}
            </dl>
          </li>
        ))}
        {visible.length === 0 && <li className="p-6 text-ink-2">{empty}</li>}
      </ul>

      {pages > 1 && (
        <nav aria-label="Table pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-ink-2">Page {current} of {pages}</span>
          <div className="flex gap-1">
            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="h-11 rounded-full border border-line px-4 disabled:opacity-40">Previous</button>
            <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="h-11 rounded-full border border-line px-4 disabled:opacity-40">Next</button>
          </div>
        </nav>
      )}
    </div>
  );
}
