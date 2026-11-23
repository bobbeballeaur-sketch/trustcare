"use client";
// Filter sidebar for doctor search. It's a normal GET form, so every filter
// lives in the page URL (results can be shared or refreshed).
// Changing a filter applies it straight away.
import { useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { ACCESS_FEATURES, LANGUAGES } from "@/lib/validation";

type Opt = { value: string; label: string };
type Values = Record<string, string | string[] | undefined>;

const arr = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const val = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function Filters({ specs, areas, values }: { specs: Opt[]; areas: Opt[]; values: Values }) {
  const { lang } = useApp();
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const submit = (delay = 0) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => ref.current?.requestSubmit(), delay);
  };

  const box = "h-11 w-full rounded-xl border border-[#cfc9bf] bg-white px-3 text-[0.95rem]";
  const legend = "mb-2 text-sm font-semibold";
  const check = "flex min-h-9 items-center gap-2.5 text-[0.95rem]";
  const cb = "h-5 w-5 shrink-0 accent-ink";

  return (
    <aside aria-labelledby="filters-title" className="lg:w-[290px] lg:shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="filter-form" className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line font-medium lg:hidden">
        <SlidersHorizontal size={18} aria-hidden="true" /> {pick(lang, "Filters", "फ़िल्टर")}
      </button>
      <form
        id="filter-form"
        ref={ref}
        action="/doctors"
        onChange={(e) => submit((e.target as unknown as HTMLInputElement).type === "number" ? 700 : 0)}
        className={`${open ? "block" : "hidden"} rounded-3xl border border-line bg-white p-5 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="filters-title" className="text-lg font-medium">{pick(lang, "Filters", "फ़िल्टर")}</h2>
          <Link href="/doctors" className="rounded-full px-3 py-2 text-sm font-medium underline underline-offset-4">{pick(lang, "Clear all", "सब हटाएं")}</Link>
        </div>
        <input type="hidden" name="q" value={val(values.q)} />
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">{pick(lang, "Specialisation", "विशेषज्ञता")}
            <select name="spec" defaultValue={val(values.spec)} className={`${box} font-normal`}>
              <option value="">{pick(lang, "Any", "कोई भी")}</option>
              {specs.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">{pick(lang, "Area of Indore", "इंदौर का क्षेत्र")}
            <select name="area" defaultValue={val(values.area)} className={`${box} font-normal`}>
              <option value="">{pick(lang, "All areas", "सभी क्षेत्र")}</option>
              {areas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className={legend}>{pick(lang, "Consultation fee (₹)", "परामर्श शुल्क (₹)")}</legend>
            <div className="flex items-center gap-2">
              <label className="flex-1"><span className="sr-only">Minimum fee</span><input type="number" name="minFee" min={100} max={5000} step={50} placeholder="Min" defaultValue={val(values.minFee)} className={box} /></label>
              <span aria-hidden="true">–</span>
              <label className="flex-1"><span className="sr-only">Maximum fee</span><input type="number" name="maxFee" min={100} max={5000} step={50} placeholder="Max" defaultValue={val(values.maxFee)} className={box} /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend className={legend}>{pick(lang, "Languages spoken", "बोली जाने वाली भाषाएं")}</legend>
            {LANGUAGES.map((l) => (
              <label key={l} className={check}><input type="checkbox" name="lang" value={l} defaultChecked={arr(values.lang).includes(l)} className={cb} />{l}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend className={legend}>{pick(lang, "Doctor's gender", "डॉक्टर का लिंग")}</legend>
            {[["", pick(lang, "Any", "कोई भी")], ["Female", pick(lang, "Female", "महिला")], ["Male", pick(lang, "Male", "पुरुष")]].map(([v, l]) => (
              <label key={v} className={check}><input type="radio" name="gender" value={v} defaultChecked={val(values.gender) === v} className={cb} />{l}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend className={legend}>{pick(lang, "Availability", "उपलब्धता")}</legend>
            {[["", pick(lang, "Any time", "कभी भी")], ["today", pick(lang, "Available today", "आज उपलब्ध")], ["week", pick(lang, "This week", "इस हफ़्ते")]].map(([v, l]) => (
              <label key={v} className={check}><input type="radio" name="when" value={v} defaultChecked={val(values.when) === v} className={cb} />{l}</label>
            ))}
            <label className={check}><input type="checkbox" name="evening" value="1" defaultChecked={val(values.evening) === "1"} className={cb} />{pick(lang, "Open evenings (after 6 pm)", "शाम को खुला (6 बजे के बाद)")}</label>
            <label className={check}><input type="checkbox" name="sunday" value="1" defaultChecked={val(values.sunday) === "1"} className={cb} />{pick(lang, "Open Sundays", "रविवार को खुला")}</label>
          </fieldset>
          <fieldset>
            <legend className={legend}>{pick(lang, "Minimum rating", "न्यूनतम रेटिंग")}</legend>
            {[["", pick(lang, "Any", "कोई भी")], ["3", "3+"], ["4", "4+"]].map(([v, l]) => (
              <label key={v} className={check}><input type="radio" name="rating" value={v} defaultChecked={val(values.rating) === v} className={cb} />{l}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend className={legend}>{pick(lang, "Experience", "अनुभव")}</legend>
            {[["", pick(lang, "Any", "कोई भी")], ["5", "5+ years"], ["10", "10+ years"], ["20", "20+ years"]].map(([v, l]) => (
              <label key={v} className={check}><input type="radio" name="exp" value={v} defaultChecked={val(values.exp) === v} className={cb} />{l}</label>
            ))}
          </fieldset>
          <label className={check}><input type="checkbox" name="video" value="1" defaultChecked={val(values.video) === "1"} className={cb} />🎥 {pick(lang, "Offers video consult", "वीडियो परामर्श उपलब्ध")}</label>
          <label className={check}><input type="checkbox" name="ayushman" value="1" defaultChecked={val(values.ayushman) === "1"} className={cb} />{pick(lang, "Accepts Ayushman card (PM-JAY)", "आयुष्मान कार्ड स्वीकार")}</label>
          <fieldset>
            <legend className={legend}>{pick(lang, "Clinic accessibility", "क्लिनिक सुविधाएं")}</legend>
            {ACCESS_FEATURES.map(([k, l]) => (
              <label key={k} className={check}><input type="checkbox" name="access" value={k} defaultChecked={arr(values.access).includes(k)} className={cb} />{l}</label>
            ))}
          </fieldset>
          <noscript><button type="submit" className="h-11 rounded-full bg-ink text-white">Apply filters</button></noscript>
        </div>
      </form>
    </aside>
  );
}

export function SortSelect({ value }: { value: string }) {
  const { lang } = useApp();
  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      {pick(lang, "Sort by", "क्रम")}
      <select
        name="sort"
        form="filter-form"
        defaultValue={value}
        onChange={() => (document.getElementById("filter-form") as HTMLFormElement | null)?.requestSubmit()}
        className="h-11 rounded-xl border border-[#cfc9bf] bg-white px-3 font-normal"
      >
        <option value="best">{pick(lang, "Best match", "सबसे उपयुक्त")}</option>
        <option value="rating">{pick(lang, "Highest rated", "सबसे ज़्यादा रेटिंग")}</option>
        <option value="feeLow">{pick(lang, "Fee: low to high", "शुल्क: कम से ज़्यादा")}</option>
        <option value="feeHigh">{pick(lang, "Fee: high to low", "शुल्क: ज़्यादा से कम")}</option>
        <option value="experience">{pick(lang, "Most experienced", "सबसे अनुभवी")}</option>
        <option value="soonest">{pick(lang, "Soonest available", "जल्द उपलब्ध")}</option>
        <option value="nearest">{pick(lang, "Nearest (pick an area)", "सबसे नज़दीक")}</option>
      </select>
    </label>
  );
}
