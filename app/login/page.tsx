import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "admin" ? "/admin" : session.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <LoginForm />
      </div>
    </main>
  );
}
