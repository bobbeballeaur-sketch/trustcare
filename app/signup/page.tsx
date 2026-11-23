// Sign up page. ?role=doctor starts the 2-step doctor registration.
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const asDoctor = (await searchParams).role === "doctor";
  return (
    <>
      <div className="lg:hidden"><SiteHeader /></div>
      <AuthLayout
        title={asDoctor ? "Register as a doctor" : "Create your account"}
        sub={asDoctor ? "Step 1 of 2: your account. Next you'll add your registration and clinic details for verification." : "Free for patients. Book for yourself and your family."}
        side={
          asDoctor ? (
            <>
              <p className="font-serif text-5xl leading-[1.05]">Join a list<br /><span className="text-white/70">patients can trust.</span></p>
              <p className="mt-6 max-w-sm text-white/85">Our team checks your registration number on the NMC Indian Medical Register before your profile appears in search.</p>
            </>
          ) : (
            <>
              <p className="font-serif text-5xl leading-[1.05]">The right doctor,<br /><span className="text-white/70">in your language.</span></p>
              <p className="mt-6 max-w-sm text-white/85">Verified doctors, real reviews and live updates if your doctor goes on leave.</p>
            </>
          )
        }
      >
        <SignupForm asDoctor={asDoctor} />
      </AuthLayout>
    </>
  );
}
