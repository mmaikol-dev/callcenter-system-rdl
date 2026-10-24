import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

const highlights = [
    'Live stock, barcode and transfer visibility',
    'Dispatch and order workflows in one place',
    'Payments, customers and reporting built in',
];

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid min-h-svh bg-background lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <div className="relative hidden overflow-hidden bg-[#08111f] p-10 text-white lg:flex lg:flex-col xl:p-14">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,.28),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(45,212,191,.18),transparent_40%)]" />
                <div className="absolute inset-0 bg-grid opacity-[0.22]" />
                <div className="absolute -left-24 top-1/3 size-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-soft" />
                <div className="absolute -right-24 bottom-0 size-80 rounded-full bg-teal-400/10 blur-3xl" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_10px_28px_-10px_rgba(16,185,129,.75)]">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <div>
                        <p className="text-base font-bold tracking-tight">AquaVita</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                            Logistics OS
                        </p>
                    </div>
                </div>

                <div className="relative z-10 mt-auto max-w-xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                        <Sparkles className="size-3.5 text-emerald-300" />
                        Operations, intelligently connected
                    </div>
                    <h1 className="text-4xl leading-[1.08] font-bold tracking-tight xl:text-5xl">
                        Run your warehouse with{' '}
                        <span className="font-display italic text-emerald-300">clarity</span> and speed.
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
                        One calm workspace for inventory, orders, dispatch, customer conversations and
                        payments — designed for teams that move fast.
                    </p>

                    <ul className="mt-8 grid gap-3">
                        {highlights.map((item) => (
                            <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                        {[
                            { value: '99.9%', label: 'System uptime' },
                            { value: '2.4×', label: 'Faster dispatch' },
                            { value: '24/7', label: 'Live visibility' },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
                            >
                                <p className="text-xl font-bold tracking-tight text-white">{stat.value}</p>
                                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-white/40">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {quote?.message ? (
                        <blockquote className="mt-8 border-l-2 border-emerald-400/50 pl-4 text-sm leading-relaxed text-white/55">
                            “{quote.message}”
                            <footer className="mt-2 text-xs font-medium text-white/35">— {quote.author}</footer>
                        </blockquote>
                    ) : (
                        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                                <TrendingUp className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white/85">Built for high-volume teams</p>
                                <p className="text-xs text-white/40">From barcode scans to final delivery.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative z-10 mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/35">
                    <span className="inline-flex items-center gap-2">
                        <ShieldCheck className="size-4 text-emerald-400/70" />
                        Enterprise-grade security
                    </span>
                    <span>© {new Date().getFullYear()} AquaVita</span>
                </div>
            </div>

            {/* Form panel */}
            <div className="relative flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_45%)]" />
                <div className="relative z-10 w-full max-w-[400px]">
                    <Link href={route('home')} className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg">
                            <AppLogoIcon className="size-6 fill-current" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold tracking-tight">AquaVita</p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                Logistics OS
                            </p>
                        </div>
                    </Link>

                    <div className="mb-8 text-left">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                    {children}
                    <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        Need access?
                        <a
                            href="mailto:support@aquavita.app"
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                            Contact your administrator
                            <ArrowUpRight className="size-3" />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
