"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

const demoAccounts = [
  { role: "Admin", email: "admin@stms.local", password: "admin123" },
  { role: "Teacher", email: "teacher@stms.local", password: "teacher123" },
  { role: "Student", email: "student@stms.local", password: "student123" }
];

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "admin@stms.local",
    password: "admin123"
  });
  const [error, setError] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
      <div className="rounded-[2rem] border border-white/10 bg-forest p-6 text-white shadow-halo sm:p-8 lg:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent">
          <Sparkles className="h-4 w-4" />
          Secure Access
        </div>
        <h1 className="mt-8 font-serif text-4xl uppercase tracking-tight sm:text-5xl">
          Login To <span className="text-accent">STMS</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
          Admin, teacher aur student ke liye अलग role-based access ready hai. Demo accounts niche diye hue hain.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {demoAccounts.map((account) => (
            <button
              key={account.role}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent/30 hover:bg-white/10"
              type="button"
              onClick={() =>
                setForm({
                  email: account.email,
                  password: account.password
                })
              }
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{account.role}</p>
              <p className="mt-3 text-sm text-white/80">{account.email}</p>
              <p className="mt-1 text-xs text-white/45">{account.password}</p>
            </button>
          ))}
        </div>
      </div>

      <form
        className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.15)] sm:p-8 lg:p-10"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
          });

          const payload = await response.json();
          setLoading(false);

          if (!response.ok) {
            setError(payload.error || "Login failed");
            return;
          }

          router.push(payload.destination);
          router.refresh();
        }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/60">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Authentication
        </div>
        <h2 className="mt-8 font-serif text-3xl uppercase tracking-tight text-ink sm:text-4xl">Welcome Back</h2>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-ink/50">Email</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-5 py-4 text-sm text-ink outline-none transition focus:border-accent"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-ink/50">Password</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-ink/10 px-5 py-4 text-sm text-ink outline-none transition focus:border-accent"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm uppercase tracking-[0.25em] text-white transition hover:bg-accent"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Enter Dashboard"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
