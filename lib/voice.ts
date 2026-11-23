// Turns what the user said into an action. Plain keyword matching in English
// and Hindi — no AI. Example: "skin doctor in Vijay Nagar" -> search page.

type VoiceAction =
  | { kind: "nav"; href: string; replyEn: string; replyHi: string }
  | { kind: "read" };

// [specialisation slug, words that mean it]
const SPEC_WORDS: [string, string, string[]][] = [
  ["dermatologist", "skin doctors", ["skin", "rash", "itch", "acne", "pimple", "hair", "dermat", "त्वचा", "चमड़ी", "खुजली", "बाल"]],
  ["dentist", "dentists", ["teeth", "tooth", "dent", "दांत", "दाँत"]],
  ["paediatrician", "children's doctors", ["child", "children", "baby", "kid", "paediat", "pediat", "बच्च", "शिशु"]],
  ["gynaecologist", "women's health doctors", ["women", "woman", "pregnan", "period", "gynae", "gyne", "महिला", "गर्भ", "स्त्री"]],
  ["orthopaedist", "bone and joint doctors", ["bone", "joint", "knee", "back pain", "ortho", "हड्डी", "जोड़", "घुटन", "कमर"]],
  ["ophthalmologist", "eye doctors", ["eye", "vision", "आंख", "आँख", "नेत्र"]],
  ["ent", "ear, nose and throat doctors", ["ear", "nose", "throat", "ent", "कान", "नाक", "गला", "गले"]],
  ["psychiatrist", "mental health doctors", ["mental", "depress", "anxiety", "stress", "sleep", "मानसिक", "तनाव", "उदास", "नींद"]],
  ["cardiologist", "heart doctors", ["heart", "cardio", "blood pressure", "हृदय", "दिल", "बीपी"]],
  ["neurologist", "brain and nerve doctors", ["brain", "nerve", "headache", "migraine", "neuro", "दिमाग", "सिरदर्द", "नस"]],
  ["gastroenterologist", "stomach doctors", ["stomach", "acidity", "gastro", "पेट", "एसिडिटी"]],
  ["endocrinologist", "diabetes doctors", ["diabet", "sugar", "thyroid", "hormone", "मधुमेह", "शुगर", "थायरॉइड"]],
  ["pulmonologist", "lung doctors", ["lung", "breath", "cough", "asthma", "फेफड़", "खांसी", "दमा", "सांस"]],
  ["general-physician", "general doctors", ["general", "fever", "cold", "physician", "बुखार", "सामान्य", "जुकाम"]],
];

const AREA_WORDS: [string, string[]][] = [
  ["Vijay Nagar", ["vijay nagar", "vijaynagar", "विजय नगर", "विजयनगर"]],
  ["Palasia", ["palasia", "पलासिया"]],
  ["Rajwada", ["rajwada", "राजवाड़ा", "राजवाडा"]],
  ["Bhawarkua", ["bhawarkua", "bhanwarkuan", "भंवरकुआं", "भँवरकुआँ"]],
  ["Sudama Nagar", ["sudama", "सुदामा"]],
  ["Annapurna", ["annapurna", "अन्नपूर्णा"]],
  ["Rau", [" rau", "राऊ"]],
  ["Navlakha", ["navlakha", "नवलखा"]],
  ["Sapna Sangeeta", ["sapna", "sangeeta", "सपना"]],
  ["MR 10", ["mr 10", "mr10", "एमआर"]],
  ["Nipania", ["nipania", "निपानिया"]],
  ["Khajrana", ["khajrana", "खजराना"]],
];

export function interpretVoice(raw: string): VoiceAction | null {
  const s = " " + raw.toLowerCase().trim() + " ";
  const has = (words: string[]) => words.some((w) => s.includes(w));

  if (has(["emergency", "ambulance", "help me", "आपात", "एम्बुलेंस", "बचाओ"]))
    return { kind: "nav", href: "/emergency", replyEn: "Opening the emergency page. Call 112 or 108 now.", replyHi: "आपातकाल पेज खोल रहे हैं। तुरंत 112 या 108 पर कॉल करें।" };
  if (has(["read", "पढ़", "सुनाओ", "सुनाइए"])) return { kind: "read" };
  if (has(["appointment", "booking", "अपॉइंटमेंट", "बुकिंग"]))
    return { kind: "nav", href: "/patient/appointments", replyEn: "Opening your appointments.", replyHi: "आपकी अपॉइंटमेंट खोल रहे हैं।" };
  if (has(["which doctor", "guide", "not sure", "कौन सा डॉक्टर", "कौनसा डॉक्टर", "गाइड"]))
    return { kind: "nav", href: "/guide", replyEn: "Opening the guide. Tell us where it hurts.", replyHi: "गाइड खोल रहे हैं। बताइए कहां तकलीफ है।" };
  if (has(["home", "होम", "मुख्य पेज"]))
    return { kind: "nav", href: "/", replyEn: "Going to the home page.", replyHi: "होम पेज पर जा रहे हैं।" };

  const spec = SPEC_WORDS.find(([, , words]) => has(words));
  const area = AREA_WORDS.find(([, words]) => has(words));
  if (spec || area || has(["doctor", "डॉक्टर"])) {
    const params = new URLSearchParams();
    if (spec) params.set("spec", spec[0]);
    if (area) params.set("area", area[0]);
    const what = spec ? spec[1] : "doctors";
    return {
      kind: "nav",
      href: `/doctors?${params.toString()}`,
      replyEn: `Showing ${what}${area ? " in " + area[0] : ""}.`,
      replyHi: `${area ? area[0] + " में " : ""}डॉक्टर दिखा रहे हैं।`,
    };
  }
  return null;
}
