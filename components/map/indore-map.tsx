"use client";
// Interactive map (Mapbox GL): starts as a spinning globe, flies into Indore,
// and shows a pin for every verified doctor and hospital. Click a pin (or a
// name in the list, for keyboard and screen-reader users) to see the doctor
// and book. The list is always available, so the map is never the only way.
import "mapbox-gl/dist/mapbox-gl.css";
import "./pins.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { BadgeCheck, Hospital as HospitalIcon, Star, Video } from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { prefersReducedMotion } from "../home/smooth-scroll";

export type MapDoctor = { id: string; name: string; spec: string; specSlug: string; area: string; fee: number; rating: number; reviews: number; lat: number; lng: number; video: boolean; videoFee: number | null; clinic: string };
export type MapHospital = { id: string; name: string; area: string; lat: number; lng: number; beds: number; icu: number; open24x7: boolean; phone: string };
type Area = { name: string; lat: number; lng: number };

// Public (pk.) Mapbox key — safe in browser code. Override with NEXT_PUBLIC_MAPBOX_TOKEN.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiaTI1cmlzaGFiaGoiLCJhIjoiY213bjY3d3R1MDFoeTJ4cXdldzl4aHlsNSJ9.u5GUC8HBmqzykrOKPbd1Iw";
const INDORE: [number, number] = [75.8577, 22.7196];

export function IndoreMap({ doctors, hospitals, areas, specs }: { doctors: MapDoctor[]; hospitals: MapHospital[]; areas: Area[]; specs: { slug: string; label: string }[] }) {
  const { lang } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [spec, setSpec] = useState("");
  const [videoOnly, setVideoOnly] = useState(false);
  const [showHospitals, setShowHospitals] = useState(true);
  const [selected, setSelected] = useState<{ kind: "doctor"; d: MapDoctor } | { kind: "hospital"; h: MapHospital } | null>(null);
  const [failed, setFailed] = useState(!TOKEN);

  const visible = useMemo(() => doctors.filter((d) => (!spec || d.specSlug === spec) && (!videoOnly || d.video)), [doctors, spec, videoOnly]);

  // Create the map once: globe view, then fly to Indore.
  useEffect(() => {
    if (!box.current || !TOKEN) return;
    try {
      mapboxgl.accessToken = TOKEN;
      const m = new mapboxgl.Map({
        container: box.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [78.9, 21.5],
        zoom: 1.6,
        projection: "globe",
        attributionControl: true,
      });
      map.current = m;
      m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      m.on("style.load", () => {
        m.setFog({ color: "rgb(247,246,243)", "high-color": "rgb(232,98,44)", "horizon-blend": 0.05, "space-color": "rgb(15,12,10)", "star-intensity": 0.4 });
      });
      m.on("load", () => {
        if (prefersReducedMotion()) m.jumpTo({ center: INDORE, zoom: 11.8 });
        else m.flyTo({ center: INDORE, zoom: 11.8, pitch: 40, bearing: -12, duration: 6500, essential: true });
      });
      m.on("error", () => {});
    } catch {
      // WebGL not available in this browser: show the list only.
      setTimeout(() => setFailed(true), 0);
    }
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // (Re)draw the pins when filters change.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    for (const d of visible) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "tc-pin";
      el.setAttribute("aria-label", `${d.name}, ${d.spec}, ${d.area}`);
      el.innerHTML = `<span>${d.name.replace(/^Dr\.?\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>${d.video ? '<i title="Video consult"></i>' : ""}`;
      el.addEventListener("click", (e) => { e.stopPropagation(); setSelected({ kind: "doctor", d }); });
      markers.current.push(new mapboxgl.Marker({ element: el }).setLngLat([d.lng, d.lat]).addTo(m));
    }
    if (showHospitals)
      for (const h of hospitals) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "tc-pin tc-pin-h";
        el.setAttribute("aria-label", `Hospital: ${h.name}`);
        el.innerHTML = "<span>H</span>";
        el.addEventListener("click", (e) => { e.stopPropagation(); setSelected({ kind: "hospital", h }); });
        markers.current.push(new mapboxgl.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(m));
      }
  }, [visible, hospitals, showHospitals]);

  const flyTo = (lat: number, lng: number, zoom = 14) => map.current?.flyTo({ center: [lng, lat], zoom, duration: prefersReducedMotion() ? 0 : 1600, essential: true });
  const chip = (on: boolean) => `h-10 rounded-full border px-4 text-sm ${on ? "border-ink bg-ink text-white" : "border-[#cfc9bf] bg-white hover:bg-soft"}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Map filters">
        <label className="flex flex-col gap-1 text-sm font-medium">{pick(lang, "Specialisation", "विशेषज्ञता")}
          <select value={spec} onChange={(e) => setSpec(e.target.value)} className="h-10 rounded-xl border border-[#cfc9bf] bg-white px-3 font-normal">
            <option value="">{pick(lang, "All doctors", "सभी डॉक्टर")}</option>
            {specs.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
          </select>
        </label>
        <button type="button" aria-pressed={videoOnly} onClick={() => setVideoOnly((v) => !v)} className={chip(videoOnly)}>🎥 {pick(lang, "Video consult", "वीडियो परामर्श")}</button>
        <button type="button" aria-pressed={showHospitals} onClick={() => setShowHospitals((v) => !v)} className={chip(showHospitals)}>🏥 {pick(lang, "Hospitals", "अस्पताल")}</button>
        <div className="flex flex-wrap gap-1.5" aria-label="Jump to an area">
          {areas.map((a) => <button key={a.name} type="button" onClick={() => flyTo(a.lat, a.lng, 13.5)} className="h-10 rounded-full bg-soft px-3 text-xs hover:bg-card">{a.name}</button>)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="relative h-[70vh] min-h-[460px] overflow-hidden rounded-3xl bg-night">
          {failed ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-white/80">The map couldn&apos;t load. Use the list of doctors instead.</div>
          ) : (
            <div ref={box} className="h-full w-full" role="region" aria-label={pick(lang, "Map of doctors and hospitals in Indore", "इंदौर में डॉक्टरों और अस्पतालों का नक्शा")} />
          )}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md rounded-2xl bg-white p-4 shadow-2xl sm:right-auto" role="dialog" aria-label="Selected place">
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">✕</button>
              {selected.kind === "doctor" ? (
                <>
                  <p className="flex items-center gap-2 pr-8 text-lg font-medium">{selected.d.name} <BadgeCheck size={17} className="text-ok" aria-label="Verified" /></p>
                  <p className="text-sm text-ink-2">{selected.d.spec} · {selected.d.clinic}, {selected.d.area}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
                    <span>🏥 Clinic ₹{selected.d.fee}</span>
                    {selected.d.video && <span className="inline-flex items-center gap-1"><Video size={14} aria-hidden="true" /> Video ₹{selected.d.videoFee}</span>}
                    <span className="inline-flex items-center gap-1 font-semibold"><Star size={14} className="fill-current" aria-hidden="true" /> {selected.d.rating.toFixed(1)} out of 5 ({selected.d.reviews})</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/doctors/${selected.d.id}`} className="rounded-full border border-[#cfc9bf] px-4 py-2.5 text-sm font-medium">{pick(lang, "View profile", "प्रोफ़ाइल देखें")}</Link>
                    <Link href={`/doctors/${selected.d.id}#book`} className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white">{pick(lang, "Book appointment", "अपॉइंटमेंट बुक करें")}</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 pr-8 text-lg font-medium"><HospitalIcon size={18} aria-hidden="true" /> {selected.h.name}</p>
                  <p className="text-sm text-ink-2">{selected.h.area} · {selected.h.open24x7 ? "Open 24×7" : "Day hours"}</p>
                  <p className="mt-2 text-sm">🛏 {selected.h.beds} beds free · ICU {selected.h.icu} free</p>
                  <div className="mt-3 flex gap-2">
                    <a href={`tel:${selected.h.phone}`} className="rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white">Call {selected.h.phone}</a>
                    <Link href={`/hospitals#h-${selected.h.id}`} className="rounded-full border border-[#cfc9bf] px-4 py-2.5 text-sm font-medium">Details</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <section aria-labelledby="map-list-h" className="flex max-h-[70vh] flex-col rounded-3xl border border-line bg-white">
          <h2 id="map-list-h" className="border-b border-line px-5 py-4 font-medium" role="status">{visible.length} {pick(lang, "doctors on the map", "डॉक्टर नक्शे पर")}</h2>
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {visible.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => { setSelected({ kind: "doctor", d }); flyTo(d.lat, d.lng); }} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-soft">
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.name}</span><span className="block truncate text-sm text-ink-2">{d.spec} · {d.area} · ₹{d.fee}</span></span>
                  {d.video && <Video size={16} aria-label="Offers video consult" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
