import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowRight,
  Barcode,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  MessagesSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  Workflow,
  Zap,
} from 'lucide-react';

const features = [
  {
    title: 'Inventory that stays honest',
    description: 'Live stock levels, barcode scans and movement history across every merchant and warehouse.',
    icon: Boxes,
  },
  {
    title: 'Orders without the chaos',
    description: 'Pull orders from sheets, assign agents and dispatch deliveries from a single queue.',
    icon: ClipboardList,
  },
  {
    title: 'Dispatch at full speed',
    description: 'Bulk waybills, reassignment and delivery tracking built for high-volume teams.',
    icon: Truck,
  },
  {
    title: 'Conversations in context',
    description: 'WhatsApp threads sit beside the customer order, so support never loses the plot.',
    icon: MessagesSquare,
  },
  {
    title: 'Payments, reconciled',
    description: 'M-Pesa STK push, transactions and remittance tracking without spreadsheet gymnastics.',
    icon: Smartphone,
  },
  {
    title: 'Decisions with evidence',
    description: 'Revenue, agent performance and product trends in dashboards your team will actually use.',
    icon: BarChart3,
  },
];

const steps = [
  {
    step: '01',
    title: 'Connect your operation',
    description: 'Bring in products, merchants, sheets and team members in minutes.',
  },
  {
    step: '02',
    title: 'Run the day',
    description: 'Scan, transfer, dispatch and message — with guardrails that prevent costly mistakes.',
  },
  {
    step: '03',
    title: 'See what matters',
    description: 'Wake up to clear alerts, forecasts and reports instead of digging through tabs.',
  },
];

export default function Welcome() {
  return (
    <>
      <Head title="AquaVita — Logistics OS" />
      <div className="relative min-h-svh overflow-x-hidden bg-background">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_62%)]" />
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute left-1/2 top-[-12rem] size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Navigation */}
        <header className="relative z-30">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href={route('home')} className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,.65)]">
                <AppLogoIcon className="size-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">AquaVita</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Logistics OS
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <a href="#platform" className="transition-colors hover:text-foreground">Platform</a>
              <a href="#features" className="transition-colors hover:text-foreground">Features</a>
              <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
            </nav>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href={route('login')}>Sign in</Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href={route('login')}>
                  Open workspace
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="relative z-10">
          <section id="platform" className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
              <div className="animate-fade-up">
                <Badge variant="outline" className="mb-6 gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">
                  <Sparkles className="size-3.5" />
                  A calmer operating system for logistics
                </Badge>
                <h1 className="max-w-2xl text-[2.6rem] leading-[1.04] font-bold tracking-tight sm:text-6xl">
                  Move stock, orders and people with{' '}
                  <span className="font-display italic text-gradient-primary">confidence.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  AquaVita unifies inventory, dispatch, customer conversations and payments into one
                  beautifully clear workspace — so your team stops juggling tools and starts moving faster.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 gap-2 px-6 text-sm">
                    <Link href={route('login')}>
                      Enter your workspace
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 gap-2 px-6 text-sm">
                    <a href="#features">
                      Explore the platform
                      <Zap className="size-4" />
                    </a>
                  </Button>
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Role-based access
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Bank-grade security
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Workflow className="size-4 text-emerald-500" />
                    Built for scale
                  </span>
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="relative animate-fade-up delay-150">
                <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-teal-400/10 blur-2xl" />
                <Card className="relative overflow-hidden rounded-[1.6rem] border-border/60 p-0 shadow-float">
                  <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-rose-400/80" />
                      <span className="size-2.5 rounded-full bg-amber-400/80" />
                      <span className="size-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="rounded-full bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Live workspace
                    </span>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Warehouse pulse
                        </p>
                        <p className="mt-1 text-lg font-bold tracking-tight">Good morning, Alex</p>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <BarChart3 className="size-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: 'Products', value: '1,248', tone: 'text-emerald-600' },
                        { label: 'In transit', value: '86', tone: 'text-sky-600' },
                        { label: 'Low stock', value: '12', tone: 'text-amber-600' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-border/60 bg-muted/25 p-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {item.label}
                          </p>
                          <p className={`mt-1 text-lg font-bold tabular-nums ${item.tone}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold">Dispatch activity</p>
                        <span className="text-[10px] text-muted-foreground">This week</span>
                      </div>
                      <div className="flex h-24 items-end gap-2">
                        {[38, 52, 44, 68, 58, 82, 72].map((height, index) => (
                          <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-primary/25 to-primary"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-[9px] text-muted-foreground">
                              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                          <Barcode className="size-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold">Barcode sync complete</p>
                          <p className="text-[10px] text-muted-foreground">248 labels processed just now</p>
                        </div>
                      </div>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>
                  </div>
                </Card>

                <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-float backdrop-blur sm:flex">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <TrendingUpIcon />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Fulfilment
                    </p>
                    <p className="text-sm font-bold">+24.8% this month</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature grid */}
          <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Designed around the work your team{' '}
                <span className="font-display italic">actually does</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                No more disconnected tools, duplicated spreadsheets or guesswork. Every workflow is one
                clear path from scan to settlement.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  className={`group hover-lift gap-0 border-border/60 p-6 animate-fade-up ${
                    ['', 'delay-75', 'delay-150', 'delay-225', 'delay-300', ''][index]
                  }`}
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section id="workflow" className="relative border-y border-border/60 bg-muted/25 py-20">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    From first scan to final mile
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    AquaVita gives every team the same source of truth, without forcing them into the same
                    screen.
                  </p>
                  <Button asChild className="mt-7 gap-2" size="lg">
                    <Link href={route('login')}>
                      Sign in to get started
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-4">
                  {steps.map((step) => (
                    <div
                      key={step.step}
                      className="group flex gap-5 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur transition-all hover:border-primary/20 hover:bg-card"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-transparent text-sm font-bold text-primary ring-1 ring-inset ring-primary/10">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{step.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#08111f] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.28),transparent_38%),radial-gradient(circle_at_85%_90%,rgba(45,212,191,.18),transparent_42%)]" />
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative z-10 mx-auto max-w-2xl">
                <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <Sparkles className="size-6 text-emerald-300" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready for a calmer, faster operation?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
                  Sign in to your AquaVita workspace and give your team the clarity they deserve.
                </p>
                <Button asChild size="lg" className="mt-8 h-12 gap-2 bg-white px-7 text-sm text-[#08111f] hover:bg-white/90">
                  <Link href={route('login')}>
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white">
                <AppLogoIcon className="size-3.5 fill-current" />
              </div>
              <span className="font-semibold text-foreground">AquaVita</span>
              <span className="text-border">•</span>
              <span>Logistics OS</span>
            </div>
            <p>© {new Date().getFullYear()} AquaVita. Built for teams in motion.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
