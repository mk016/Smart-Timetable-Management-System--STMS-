import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CalendarClock,
  Database,
  Download,
  ShieldCheck,
  Sparkles,
  WandSparkles
} from "lucide-react";

import { RevealEffects } from "@/components/reveal-effects";
import { dashboardStats, getAppData } from "@/lib/app-data";

const workflow = [
  "Input Data",
  "Validate Constraints",
  "Generate Timetable",
  "Detect Conflicts",
  "AI Explain & Suggest",
  "Publish & Export"
];

export default async function HomePage() {
  const data = await getAppData({ ensureTimetable: true });
  const stats = dashboardStats(data);

  return (
    <main className="overflow-x-hidden bg-canvas text-ink">
      <RevealEffects />
      <div className="noise-overlay pointer-events-none fixed inset-0 z-[100] opacity-[0.03] mix-blend-multiply" />
      <div
        className="fixed left-0 top-0 z-[110] h-1 origin-left bg-accent transition-transform duration-150 ease-out"
        id="scroll-progress"
        style={{ transform: "scaleX(0)" }}
      />

      <div className="fixed left-0 right-0 top-3 z-50 flex justify-center px-3 sm:top-6 sm:px-6">
        <header className="reveal in-view w-full max-w-[1100px] rounded-[2rem] border border-ink/10 bg-canvas/80 px-4 py-4 shadow-[0_8px_32px_rgba(45,50,47,0.05)] backdrop-blur-xl md:rounded-full md:px-8 md:py-0">
          <div className="flex items-center justify-between gap-4 md:h-16">
            <Link href="/" className="font-serif text-lg uppercase tracking-tight text-ink sm:text-xl">
              STMS <span className="text-accent">Flow</span>
            </Link>
            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-8 md:flex">
                <a className="text-xs uppercase tracking-[0.2em] text-ink/60 transition hover:text-accent" href="#vision">
                  Vision
                </a>
                <a className="text-xs uppercase tracking-[0.2em] text-ink/60 transition hover:text-accent" href="#modules">
                  Modules
                </a>
                <a className="text-xs uppercase tracking-[0.2em] text-ink/60 transition hover:text-accent" href="#workflow">
                  Workflow
                </a>
                <a className="text-xs uppercase tracking-[0.2em] text-ink/60 transition hover:text-accent" href="#dashboards">
                  Dashboards
                </a>
              </nav>
              <Link
                href="/login"
                className="inline-flex rounded-full bg-ink px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition hover:bg-accent sm:px-5 sm:text-xs"
              >
                Login
              </Link>
            </div>
          </div>
          <nav className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {["vision", "modules", "workflow", "dashboards"].map((item) => (
              <a
                key={item}
                className="shrink-0 rounded-full border border-ink/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-ink/65"
                href={`#${item}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </header>
      </div>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-16 pt-36 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="bg-grid absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center text-center">
          <div className="reveal delay-100 inline-flex items-center gap-3 rounded-full border border-accent/20 bg-white/60 px-5 py-2 text-xs uppercase tracking-[0.25em] text-ink/80 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-accent" />
            Smart Timetable Management System
          </div>

          <h1 className="mt-8 max-w-6xl text-balance font-serif text-[clamp(3rem,13vw,9rem)] uppercase leading-[0.9] tracking-tight text-ink">
            <span className="reveal delay-200 block">Orchestrate Flawless</span>
            <span className="reveal delay-300 block bg-gradient-to-r from-ink to-accent bg-clip-text text-transparent">
              Academic Schedules
            </span>
          </h1>

          <p className="reveal delay-400 mt-8 max-w-4xl text-balance font-serif text-base leading-relaxed text-ink/70 sm:text-xl md:text-3xl">
            The intelligent operating system for educational institutes. Automate timetable generation, resolve complex resource conflicts, and streamline campus operations with AI-powered precision.
          </p>

          <div className="reveal delay-500 mt-6 text-sm uppercase tracking-[0.3em] text-ink/45">
            Enterprise Grade • AI Co-Pilot • Real-time Sync • Automated Deployment
          </div>

          <div className="reveal delay-500 mt-12 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
            <Link
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-10 py-4 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-accent sm:w-auto"
              href="/login"
            >
              Access Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-10 py-4 text-sm uppercase tracking-[0.2em] text-ink transition hover:border-accent hover:text-accent sm:w-auto"
              href="#workflow"
            >
              Explore Architecture
            </a>
          </div>
        </div>
      </section>

      <section className="relative -mt-10 overflow-hidden rounded-t-[3rem] bg-forest py-20 sm:py-24 md:py-28" id="vision">
        <div className="bg-grid-dark absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-[1080px] px-4 text-center sm:px-6">
          <div className="reveal flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-xs uppercase tracking-[0.35em] text-accent">The Vision</span>
            <span className="h-px w-12 bg-accent" />
          </div>
          <h2 className="reveal delay-100 mt-8 text-balance font-serif text-3xl uppercase leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl">
            From Operational Chaos To <span className="block text-accent">Predictable Harmony</span>
          </h2>
          <p className="reveal delay-200 mx-auto mt-8 max-w-4xl text-balance font-serif text-base leading-relaxed text-white/65 sm:text-lg md:text-2xl">
            STMS consolidates your entire scheduling lifecycle into a single, unified platform. By combining deterministic constraint solvers with intelligent role-based interfaces, we eliminate administrative overhead and ensure zero operational overlaps across faculty and infrastructure.
          </p>
        </div>
      </section>

      <section className="bg-forest px-4 pb-20 sm:px-6 sm:pb-28" id="modules">
        <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-4">
          {[
            {
              title: "Algorithmic Solver",
              icon: ShieldCheck,
              text: "A highly optimized deterministic scheduling engine that dynamically prevents faculty clashes, room overlaps, and capacity violations."
            },
            {
              title: "Unified Data Core",
              icon: Database,
              text: "A centralized repository for your academic blueprints. Effortlessly manage campus topology, departmental assets, and faculty availability."
            },
            {
              title: "AI Co-Pilot",
              icon: WandSparkles,
              text: "Integrated machine learning models that analyze scheduling bottlenecks, parse natural language commands, and suggest optimal resolutions."
            },
            {
              title: "Instant Publishing",
              icon: Download,
              text: "Deploy finalized schedules directly to personalized portals. Support for robust interoperability via comprehensive PDF and CSV exports."
            }
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`reveal rounded-[2rem] border border-white/10 bg-[#2d322f] p-5 text-white transition duration-500 hover:border-accent/30 sm:p-8 ${index === 3 ? "lg:col-span-1" : ""}`}
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-3xl uppercase tracking-tight">{card.title}</h3>
                <p className="mt-5 text-sm leading-7 text-white/60">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-forest px-4 sm:px-6" id="workflow">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center transition-transform duration-1000"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-forest/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-accent/10 to-forest" />
        <div className="relative z-10 mx-auto max-w-[1200px] px-4 text-center text-white sm:px-6">
          <div className="reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/70">
            <CalendarClock className="h-4 w-4 text-accent" />
            Product Workflow
          </div>
          <h2 className="reveal delay-100 mt-8 text-balance font-serif text-3xl uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">
            Input To Output <span className="block text-accent">In One Continuous Loop</span>
          </h2>
          <div className="reveal delay-200 mt-10 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {workflow.map((step) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5 text-sm uppercase tracking-[0.2em] text-white/75 backdrop-blur-md">
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative -mt-10 rounded-t-[3rem] bg-canvas px-4 py-20 sm:px-6 sm:py-28" id="dashboards">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent">
                <Blocks className="h-4 w-4" />
                Live Product Surface
              </div>
              <h2 className="mt-8 text-balance font-serif text-3xl uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl md:text-6xl">
                Engineered For <span className="block text-accent">Scale & Clarity</span>
              </h2>
              <p className="mt-6 max-w-2xl text-balance font-serif text-base leading-relaxed text-ink/65 sm:text-xl">
                Experience a meticulously crafted application ecosystem. From extensive administrative control centers to focused, distraction-free portals for students and faculty.
              </p>
              <div className="mt-10 grid gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-ink/10 bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-accent">{stat.label}</p>
                    <p className="mt-3 text-4xl text-ink">{stat.value}</p>
                    <p className="mt-2 text-sm text-ink/55">{stat.subtext}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-accent">Control Center</p>
                <h3 className="mt-3 font-serif text-3xl uppercase tracking-tight text-ink sm:text-4xl">Generate. Validate. Distribute.</h3>
                <p className="mt-4 text-sm leading-7 text-ink/60">
                  Command your institution from a single pane of glass. Monitor algorithmic constraint validations, analyze AI-driven quality metrics, and execute instantaneous enterprise-wide schedule deployments.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-forest p-5 text-white sm:p-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-accent">Faculty Portal</p>
                  <h3 className="mt-3 font-serif text-3xl uppercase tracking-tight">Real-Time Clarity</h3>
                  <p className="mt-4 text-sm leading-7 text-white/60">
                    Provide educators with immediate visibility into their daily commitments, specialized room assignments, and upcoming structural schedule changes.
                  </p>
                </div>
                <div className="rounded-[2rem] border border-ink/10 bg-white p-5 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-accent">Student Portal</p>
                  <h3 className="mt-3 font-serif text-3xl uppercase tracking-tight text-ink">Frictionless Access</h3>
                  <p className="mt-4 text-sm leading-7 text-ink/60">
                    Deliver a highly responsive, cohort-specific academic itinerary. Students receive guaranteed accuracy for room locations and session timings.
                  </p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-accent/20 bg-gradient-to-r from-accent/15 to-transparent p-5 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-accent">Technical Stack</p>
                <p className="mt-3 text-lg leading-8 text-ink/70">
                  Built on high-performance Edge infrastructure leveraging cutting-edge web frameworks, deterministic constraint evaluators, dynamic relational datastores, and state-of-the-art cryptographic session management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest px-4 py-20 text-center text-white sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-8 h-px w-12 bg-accent" />
          <p className="text-xs uppercase tracking-[0.35em] text-accent/80">Experience The Future</p>
          <h2 className="mt-6 text-balance font-serif text-3xl uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">
            Upgrade Your Campus <span className="text-accent">Infrastructure</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-balance font-serif text-base leading-relaxed text-white/60 sm:text-xl">
            Streamline your academic operations today. Access our interactive demonstration environments and witness the algorithmic efficiency firsthand.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-4 text-xs uppercase tracking-[0.25em] text-forest transition hover:bg-accent hover:text-white"
            >
              Open Login
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-10 py-4 text-xs uppercase tracking-[0.25em] text-white transition hover:bg-white hover:text-forest"
            >
              Open Admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
