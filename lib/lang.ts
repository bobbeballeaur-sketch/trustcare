// Reads the visitor's chosen language from the "lang" cookie (server side).
import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "hi" ? "hi" : "en";
}
