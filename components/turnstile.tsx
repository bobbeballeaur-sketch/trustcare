"use client";
// Cloudflare Turnstile CAPTCHA. It usually verifies people without a puzzle,
// which is why we chose it: puzzle CAPTCHAs are very hard for blind users.
// The widget puts a hidden "cf-turnstile-response" token into the form;
// the server checks that token with Cloudflare (see lib/turnstile.ts).
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
const IS_TEST_KEY = SITE_KEY.startsWith("1x0000");

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
    onTurnstileLoad?: () => void;
  }
}

export function Turnstile({ onVerify, error }: { onVerify?: (ok: boolean) => void; error?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [devChecked, setDevChecked] = useState(false);

  useEffect(() => {
    const render = () => {
      if (!box.current || !window.turnstile || box.current.dataset.done) return;
      box.current.dataset.done = "1";
      window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        theme: "light",
        callback: () => onVerify?.(true),
        "expired-callback": () => onVerify?.(false),
        "error-callback": () => onVerify?.(false),
      });
    };
    window.onTurnstileLoad = render;
    if (window.turnstile) render();
    // If Cloudflare can't be reached (e.g. offline development) show a test checkbox.
    const t = setTimeout(() => { if (!window.turnstile) setFailed(true); }, 6000);
    return () => clearTimeout(t);
  }, [onVerify]);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Security check <span className="font-normal text-ink-2">(required)</span></p>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit" strategy="afterInteractive" onError={() => setFailed(true)} />
      {!failed && <div ref={box} className="min-h-[65px]" />}
      {failed && IS_TEST_KEY && (
        <label className="flex h-[65px] items-center gap-3 rounded-lg border border-line bg-soft px-4">
          <input
            type="checkbox"
            className="h-6 w-6 accent-ink"
            checked={devChecked}
            onChange={(e) => { setDevChecked(e.target.checked); onVerify?.(e.target.checked); }}
          />
          <span>Verify you are human <span className="text-xs text-ink-2">(CAPTCHA test mode)</span></span>
          {devChecked && <input type="hidden" name="cf-turnstile-response" value="XXXX.DUMMY.TOKEN.XXXX" />}
        </label>
      )}
      {error && <p className="text-sm font-medium text-danger" role="alert">⚠ {error}</p>}
    </div>
  );
}
