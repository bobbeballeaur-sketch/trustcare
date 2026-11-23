// Log in page.
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const { next } = await searchParams;
  return (
    <>
      <div className="lg:hidden"><SiteHeader /></div>
      <AuthLayout
        title="Welcome back."
        sub="Log in to book visits, manage your family's appointments and get live updates."
        side={
          <>
            <p className="font-serif text-5xl leading-[1.05]">Your health,<br /><span className="text-white/70">in safe hands.</span></p>
            <ul className="mt-8 space-y-2 text-white/85">
              <li>✓ Patients, doctors and admins each get their own dashboard</li>
              <li>✓ Our CAPTCHA usually needs no puzzle — friendly for blind users</li>
              <li>✓ Passwords are stored encrypted, never in plain text</li>
            </ul>
          </>
        }
      >
        <LoginForm next={next} />
      </AuthLayout>
    </>
  );
}
