// English / Hindi text. English is the default; the choice is saved in a cookie.
// Use: t(lang, "key") for shared words, or pick(lang, "English", "हिंदी") inline.

export type Lang = "en" | "hi";

const dict = {
  findDoctor: ["Find a doctor", "डॉक्टर खोजें"],
  guide: ["Which doctor do I need?", "मुझे कौन सा डॉक्टर चाहिए?"],
  emergency: ["Emergency", "आपातकाल"],
  login: ["Log in", "लॉग इन"],
  signup: ["Get started", "शुरू करें"],
  logout: ["Log out", "लॉग आउट"],
  myAppointments: ["My appointments", "मेरी अपॉइंटमेंट"],
  saved: ["Saved doctors", "सहेजे गए डॉक्टर"],
  family: ["Family", "परिवार"],
  myReviews: ["My reviews", "मेरी समीक्षाएं"],
  notifications: ["Notifications", "सूचनाएं"],
  accessibility: ["Accessibility", "सुलभता"],
  textSmaller: ["Smaller text", "छोटा टेक्स्ट"],
  textNormal: ["Normal text size", "सामान्य टेक्स्ट"],
  textLarger: ["Larger text", "बड़ा टेक्स्ट"],
  highContrast: ["High contrast", "हाई कंट्रास्ट"],
  reduceMotion: ["Reduce motion", "कम एनिमेशन"],
  listen: ["Listen", "सुनें"],
  stop: ["Stop", "रोकें"],
  speak: ["Speak", "बोलिए"],
  verified: ["Verified", "सत्यापित"],
  book: ["Book", "बुक करें"],
  viewProfile: ["View profile", "प्रोफ़ाइल देखें"],
  demoData: ["Demo data — all doctors and reviews are fictional.", "डेमो डेटा — सभी डॉक्टर और समीक्षाएं काल्पनिक हैं।"],
  noAdvice: ["This website does not give medical advice.", "यह वेबसाइट चिकित्सा सलाह नहीं देती।"],
  required: ["required", "ज़रूरी"],
  dashboard: ["Dashboard", "डैशबोर्ड"],
} as const satisfies Record<string, readonly [string, string]>;

export type DictKey = keyof typeof dict;

export function t(lang: Lang, key: DictKey): string {
  return dict[key][lang === "hi" ? 1 : 0];
}

export function pick(lang: Lang, en: string, hi: string): string {
  return lang === "hi" ? hi : en;
}
