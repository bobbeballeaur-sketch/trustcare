// Uses the doctor portal layout for doctors and the normal layout for everyone else.
import { Shell } from "./shell";
import { Portal, DOCTOR_LINKS } from "./portal";

export function RoleShell({ role, children }: { role: string; children: React.ReactNode }) {
  if (role === "DOCTOR") return <Portal title="Doctor portal" links={DOCTOR_LINKS}>{children}</Portal>;
  return <Shell wide>{children}</Shell>;
}
