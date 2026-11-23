// Find a doctor: search, filters, sorting and pagination.
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { searchDoctors, type SearchParams } from "@/lib/doctors";
import { Shell, EmptyState } from "@/components/shell";
import { SearchBox } from "@/components/search-box";
import { Filters, SortSelect } from "@/components/doctors/filters";
import { DoctorCard } from "@/components/doctors/doctor-card";

export const metadata = { title: "Find a doctor" };

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [lang, user, specs, areas, result] = await Promise.all([
    getLang(),
    getCurrentUser(),
    db.specialisation.findMany({ orderBy: { simpleName: "asc" } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
    searchDoctors(sp),
  ]);
  const saved = user?.role === "PATIENT"
    ? new Set((await db.savedDoctor.findMany({ where: { patientId: user.id } })).map((s) => s.doctorId))
    : new Set<string>();

  const specRow = specs.find((s) => s.slug === result.resolved.spec);
  const heading = [
    specRow ? (lang === "hi" ? specRow.hindiName : `${specRow.simpleName}s`) : pick(lang, "Verified doctors", "सत्यापित डॉक्टर"),
    result.resolved.area ? pick(lang, `in ${result.resolved.area}`, `${result.resolved.area} में`) : pick(lang, "in Indore", "इंदौर में"),
  ].join(" ");

  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) if (k !== "page") u.append(k, x);
    u.set("page", String(p));
    return `/doctors?${u.toString()}`;
  };
  const values = { ...sp, spec: result.resolved.spec, area: result.resolved.area, q: result.resolved.q };

  return (
    <Shell wide>
      <div className="mb-8 max-w-3xl">
        <SearchBox variant="light" areas={areas.map((a) => ({ name: a.name, hindiName: a.hindiName }))} defaultQuery={result.resolved.q} defaultArea={result.resolved.area} />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <Filters
          specs={specs.map((s) => ({ value: s.slug, label: `${lang === "hi" ? s.hindiName : s.simpleName} (${s.name})` }))}
          areas={areas.map((a) => ({ value: a.name, label: lang === "hi" ? a.hindiName : a.name }))}
          values={values}
        />
        <section aria-labelledby="results-title" className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 id="results-title" className="text-[clamp(1.7rem,3vw,2.4rem)] font-medium tracking-[-0.03em]">{heading}</h1>
              <p role="status" className="mt-1 text-ink-2">
                <b className="text-ink">{result.total} {pick(lang, result.total === 1 ? "doctor found" : "doctors found", "डॉक्टर मिले")}</b> · {pick(lang, "only verified doctors are shown", "सिर्फ़ सत्यापित डॉक्टर दिखाए जाते हैं")}
              </p>
            </div>
            <SortSelect value={result.resolved.sort} />
          </div>

          {result.doctors.length === 0 ? (
            <EmptyState title={pick(lang, "No doctors match.", "कोई डॉक्टर नहीं मिला।")} text={pick(lang, "Try removing a filter.", "कोई फ़िल्टर हटाकर देखें।")} href="/doctors" cta={pick(lang, "Clear all filters", "सब फ़िल्टर हटाएं")} />
          ) : (
            <ul className="flex flex-col gap-3">
              {result.doctors.map((d) => (
                <li key={d.id}><DoctorCard d={d} lang={lang} saved={saved.has(d.id)} canSave={user?.role === "PATIENT"} /></li>
              ))}
            </ul>
          )}

          {result.pages > 1 && (
            <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-ink-2">{pick(lang, `Page ${result.page} of ${result.pages}`, `पेज ${result.page} / ${result.pages}`)} · 10 {pick(lang, "per page", "प्रति पेज")}</span>
              <div className="flex gap-2">
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageHref(p)} aria-current={p === result.page ? "page" : undefined} className={`flex h-11 w-11 items-center justify-center rounded-full ${p === result.page ? "bg-ink text-white" : "border border-line hover:bg-soft"}`}>{p}</Link>
                ))}
              </div>
            </nav>
          )}
        </section>
      </div>
    </Shell>
  );
}
