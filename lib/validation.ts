// Validation rules shared by the browser (instant feedback) and the server
// (the real check). The server ALWAYS re-checks, because anything sent from
// a browser can be changed by the user.
import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password needs at least one letter.")
  .regex(/\d/, "Password needs at least one number.");

const email = z.string().trim().toLowerCase().email("Enter a valid email address, like name@example.com.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
    email,
    phone,
    password,
    confirmPassword: z.string(),
    preferredLanguage: z.enum(["en", "hi"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const LANGUAGES = ["Hindi", "English", "Marathi", "Gujarati", "Sindhi", "Malwi"] as const;
export const COUNCILS = [
  "Madhya Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Gujarat Medical Council",
  "Rajasthan Medical Council",
  "Delhi Medical Council",
  "National Medical Commission",
] as const;
export const ACCESS_FEATURES = [
  ["ramp", "Wheelchair ramp"],
  ["lift", "Lift"],
  ["accessibleWashroom", "Accessible washroom"],
  ["groundFloor", "Ground floor clinic"],
  ["signLanguage", "Staff know sign language"],
  ["textBooking", "Accepts WhatsApp / text booking"],
  ["homeVisits", "Home visits"],
] as const;

const currentYear = new Date().getFullYear();

export const doctorProfileSchema = z.object({
  qualifications: z.string().trim().min(2, "Enter your qualifications, e.g. MBBS, MD.").max(120),
  specialisationId: z.string().min(1, "Choose your main specialisation."),
  experienceYears: z.coerce.number().int("Whole years only.").min(0, "Experience can't be negative.").max(60, "Experience must be 60 years or less."),
  gender: z.enum(["Female", "Male", "Other"], { message: "Choose a gender." }),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Choose at least one language."),
  bio: z.string().trim().min(50, "Bio must be at least 50 characters.").max(500, "Bio must be 500 characters or less."),
  registrationNumber: z.string().trim().regex(/^[A-Za-z0-9/-]{4,20}$/, "Enter a valid registration number (4–20 letters or numbers)."),
  stateMedicalCouncil: z.enum(COUNCILS, { message: "Choose your State Medical Council." }),
  registrationYear: z.coerce.number().int().min(1960, "Year must be 1960 or later.").max(currentYear, "Year can't be in the future."),
  clinicName: z.string().trim().min(2, "Enter the clinic name.").max(100),
  clinicAddress: z.string().trim().min(8, "Enter the full clinic address.").max(200),
  areaId: z.string().min(1, "Choose an area of Indore."),
  pinCode: z.string().trim().regex(/^4\d{5}$/, "Enter a 6-digit Indore PIN code (starts with 4)."),
  clinicPhone: phone,
  fee: z.coerce.number().int().min(100, "Fee must be at least ₹100.").max(5000, "Fee must be ₹5,000 or less."),
  acceptsAyushman: z.boolean(),
  ramp: z.boolean(),
  lift: z.boolean(),
  accessibleWashroom: z.boolean(),
  groundFloor: z.boolean(),
  signLanguage: z.boolean(),
  textBooking: z.boolean(),
  homeVisits: z.boolean(),
  offersVideo: z.boolean(),
  videoFee: z.coerce.number().int().min(100, "Video fee must be at least ₹100.").max(5000, "Video fee must be ₹5,000 or less.").optional(),
  consent: z.literal(true, { message: "Please confirm these details are true." }),
});

export const familyMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(80),
  relationship: z.enum(["Mother", "Father", "Child", "Spouse", "Grandparent", "Other"], { message: "Choose a relationship." }),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date of birth.")
    .refine((d) => d <= new Date().toISOString().slice(0, 10), "Date of birth can't be in the future."),
  gender: z.enum(["Female", "Male", "Other"], { message: "Choose a gender." }),
  accessibilityNeeds: z.string().trim().max(200, "Keep it under 200 characters.").optional(),
});

export const bookingSchema = z.object({
  doctorId: z.string().min(1),
  mode: z.enum(["CLINIC", "VIDEO"]).default("CLINIC"),
  familyMemberId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  startMinute: z.coerce.number().int().min(0).max(24 * 60),
  reasonForVisit: z.string().trim().max(200, "Keep the reason under 200 characters.").optional(),
  accessibilityNote: z.string().trim().max(200, "Keep the note under 200 characters.").optional(),
});

const rating = z.coerce.number().int().min(1, "Choose 1 to 5 stars.").max(5, "Choose 1 to 5 stars.");
export const reviewSchema = z.object({
  waitRating: rating,
  explanationRating: rating,
  valueRating: rating,
  text: z
    .string()
    .trim()
    .max(500, "Review must be 500 characters or less.")
    .refine((t) => t.length === 0 || t.length >= 20, "Write at least 20 characters, or leave it empty.")
    .optional(),
});

export const leaveSchema = z
  .object({
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date."),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an end date."),
    reason: z.string().trim().max(120).optional(),
  })
  .refine((d) => d.toDate >= d.fromDate, { path: ["toDate"], message: "End date must be on or after the start date." });

export const blockSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    start: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
  })
  .refine((d) => d.end > d.start, { path: ["end"], message: "End time must be after start time." });

export const specialisationSchema = z.object({
  name: z.string().trim().min(3, "Enter the medical name, e.g. Dermatologist.").max(60),
  simpleName: z.string().trim().min(3, "Enter a plain-words name, e.g. Skin doctor.").max(60),
  hindiName: z.string().trim().min(2, "Enter the Hindi name.").max(60),
});

export const reasonSchema = z.string().trim().min(5, "Please give a reason (at least 5 characters).").max(300);

/** Turns zod errors into { field: "first message" } for showing under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9."),
  preferredLanguage: z.enum(["en", "hi"]),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Password must be at least 8 characters.").regex(/[A-Za-z]/, "Password needs at least one letter.").regex(/\d/, "Password needs at least one number."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

/** Luhn check: catches most mistyped card numbers. */
function luhn(num: string) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Bank of Baroda"] as const;

export const paymentSchema = z
  .object({
    method: z.enum(["upi", "card", "netbanking"], { message: "Choose how to pay." }),
    upiId: z.string().trim().optional(),
    cardNumber: z.string().optional(),
    cardName: z.string().trim().optional(),
    expiry: z.string().trim().optional(),
    cvv: z.string().trim().optional(),
    bank: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.method === "upi" && !/^[\w.-]{2,64}@[a-zA-Z]{2,32}$/.test(d.upiId ?? ""))
      ctx.addIssue({ code: "custom", path: ["upiId"], message: "Enter a UPI ID like name@okaxis." });
    if (d.method === "card") {
      const num = (d.cardNumber ?? "").replace(/\s/g, "");
      if (!/^\d{16}$/.test(num) || !luhn(num)) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a valid 16-digit card number (demo: 4111 1111 1111 1111)." });
      if ((d.cardName ?? "").length < 2) ctx.addIssue({ code: "custom", path: ["cardName"], message: "Enter the name on the card." });
      const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(d.expiry ?? "");
      const now = new Date();
      if (!m || Number(m[2]) + 2000 < now.getFullYear() || (Number(m[2]) + 2000 === now.getFullYear() && Number(m[1]) < now.getMonth() + 1))
        ctx.addIssue({ code: "custom", path: ["expiry"], message: "Enter a future expiry date as MM/YY." });
      if (!/^\d{3}$/.test(d.cvv ?? "")) ctx.addIssue({ code: "custom", path: ["cvv"], message: "Enter the 3-digit CVV." });
    }
    if (d.method === "netbanking" && !(BANKS as readonly string[]).includes(d.bank ?? ""))
      ctx.addIssue({ code: "custom", path: ["bank"], message: "Choose your bank." });
  });

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export const hospitalSchema = z.object({
  phone: z.string().trim().regex(/^[0-9-]{10,13}$/, "Enter a valid phone number."),
  bedsAvailable: z.coerce.number().int("Whole numbers only.").min(0, "Can't be negative.").max(2000, "That's too many beds."),
  icuAvailable: z.coerce.number().int("Whole numbers only.").min(0, "Can't be negative.").max(500, "That's too many ICU beds."),
  oxygenAvailable: z.boolean(),
  open24x7: z.boolean(),
  emergencyWard: z.boolean(),
  acceptsAyushman: z.boolean(),
  bloodGroups: z.array(z.enum(BLOOD_GROUPS)),
  specialities: z.string().trim().max(300, "Keep it under 300 characters."),
});
