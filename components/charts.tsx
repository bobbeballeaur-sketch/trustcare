"use client";
// Charts (Recharts). One calm colour per series, values labelled directly,
// and a text summary for screen readers.
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const INK = "#0b0a09";
const ACCENT = "#b0451b";

export function DailyLine({ data, label }: { data: { day: string; count: number }[]; label: string }) {
  return (
    <figure>
      <div role="img" aria-label={label} className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#ece8e1" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#66615a" }} interval={4} tickLine={false} axisLine={{ stroke: "#d8d3ca" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#66615a" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e2db" }} />
            <Line type="linear" dataKey="count" name="Appointments" stroke={INK} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

export function HBar({ data, label, highlightLow = false, suffix = "" }: { data: { name: string; value: number }[]; label: string; highlightLow?: boolean; suffix?: string }) {
  const min = Math.min(...data.map((d) => d.value));
  return (
    <figure>
      <div role="img" aria-label={`${label}: ${data.map((d) => `${d.name} ${d.value}${suffix}`).join(", ")}`} style={{ height: Math.max(160, data.length * 34) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "#3b3733" }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#f7f6f3" }} contentStyle={{ borderRadius: 12, border: "1px solid #e6e2db" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false}>
              {data.map((d) => <Cell key={d.name} fill={highlightLow && d.value === min ? ACCENT : INK} />)}
              <LabelList dataKey="value" position="right" formatter={(v: unknown) => `${v}${suffix}`} style={{ fontSize: 12, fill: "#0b0a09", fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
