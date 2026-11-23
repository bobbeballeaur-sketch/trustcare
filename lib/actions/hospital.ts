"use server";
// Hospital portal: the hospital keeps its beds, ICU, oxygen and blood stock up to date.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fieldErrors, hospitalSchema, type FormState } from "@/lib/validation";

export async function updateHospitalAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["HOSPITAL"]);
  const hospital = await db.hospital.findUnique({ where: { userId: user.id } });
  // SECURITY: a hospital account can only edit its own hospital.
  if (!hospital) return { message: "No hospital is linked to this account." };
  const bool = (k: string) => fd.get(k) === "on";
  const parsed = hospitalSchema.safeParse({
    phone: fd.get("phone"), bedsAvailable: fd.get("bedsAvailable"), icuAvailable: fd.get("icuAvailable"),
    oxygenAvailable: bool("oxygenAvailable"), open24x7: bool("open24x7"), emergencyWard: bool("emergencyWard"), acceptsAyushman: bool("acceptsAyushman"),
    bloodGroups: fd.getAll("bloodGroups"), specialities: fd.get("specialities") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { specialities, ...rest } = parsed.data;
  await db.hospital.update({
    where: { id: hospital.id },
    data: { ...rest, bloodBank: rest.bloodGroups.length > 0, specialities: specialities.split(",").map((s) => s.trim()).filter(Boolean) },
  });
  revalidatePath("/hospital");
  revalidatePath("/hospitals");
  return { ok: true, message: "Hospital information updated. Patients see it straight away." };
}
