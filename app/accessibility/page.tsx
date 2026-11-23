// Accessibility statement.
import { Shell, PageTitle } from "@/components/shell";

export const metadata = { title: "Accessibility statement" };

const ITEMS: [string, string][] = [
  ["Screen readers", "Real headings and landmarks, a visible label on every field, errors linked to their fields, live announcements for updates, and ratings read as words (“4.5 out of 5 stars, 38 reviews”). Tested with NVDA and TalkBack."],
  ["Keyboard only", "Everything works with Tab, Shift+Tab, Enter, Space and Esc. A “Skip to main content” link comes first, focus is always visible, and pop-ups keep focus inside and close with Esc."],
  ["Low vision", "Text contrast of at least 4.5:1, body text of at least 16 px, tap targets of at least 44 × 44 px, a text-size control (A− / A / A+), a high-contrast mode, and pages that work at 200% zoom."],
  ["Colour blindness", "Colour is never the only signal: every status has an icon and a word, booked slots are crossed out and say “Booked”, and charts label values directly."],
  ["Motion", "A Reduce motion switch, which also follows your device setting, turns off the animations."],
  ["Elderly, low-literacy and Hindi-speaking users", "Plain words with the medical term in brackets, booking in short steps, a full Hindi option, read-aloud, voice search and a voice assistant, and a “Call clinic” button on every profile."],
  ["Accessible clinics", "Doctors list their clinic's ramp, lift, washroom, ground floor, sign language and other features. Patients can filter by them and add their needs when booking."],
];

export default function AccessibilityPage() {
  return (
    <Shell>
      <PageTitle eyebrow="Built for everyone" title="Accessibility statement" sub="TrustCare aims to meet WCAG 2.2 Level AA on every page." />
      <ul className="grid gap-3 md:grid-cols-2">
        {ITEMS.map(([h, t]) => (
          <li key={h} className="rounded-3xl border border-line bg-white p-6"><h2 className="text-lg font-medium">{h}</h2><p className="mt-2 text-ink-2">{t}</p></li>
        ))}
      </ul>
      <section className="mt-8 rounded-3xl bg-soft p-6">
        <h2 className="text-lg font-medium">Why we chose Cloudflare Turnstile as our CAPTCHA</h2>
        <p className="mt-2 text-ink-2">Puzzle CAPTCHAs (“click all the traffic lights”) are very hard for blind and low-vision users. Turnstile usually verifies a person without any puzzle, so everyone can log in safely.</p>
      </section>
    </Shell>
  );
}
