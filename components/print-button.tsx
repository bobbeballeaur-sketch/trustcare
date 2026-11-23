"use client";
// Opens the browser's print dialog (save the receipt as PDF).
export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">Print / save receipt</button>;
}
