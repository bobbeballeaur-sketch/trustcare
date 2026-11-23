// Root layout: fonts, language, accessibility settings, header and footer
// wrap every page of the site.
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/500.css";
import "./globals.css";
import { getLang } from "@/lib/lang";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "TrustCare — the right verified doctor in Indore", template: "%s · TrustCare" },
  description: "Find a verified doctor in Indore for your problem, budget and language, and book an appointment that actually happens.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0a09" };

// Applies saved accessibility settings before the page paints (no flicker).
const prefsScript = `try{var p=JSON.parse(localStorage.getItem('tc_a11y')||'{}');var h=document.documentElement;if(p.text)h.dataset.text=p.text;if(p.contrast)h.dataset.contrast=p.contrast;if(p.motion)h.dataset.motion=p.motion;}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
