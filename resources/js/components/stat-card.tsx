import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Tone = 'primary' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose' | 'slate';

const toneStyles: Record<Tone, { tile: string; glow: string }> = {
  primary: {
    tile: 'bg-primary/10 text-primary ring-primary/15',
    glow: 'from-primary/10',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400',
    glow: 'from-emerald-500/10',
  },
  blue: {
    tile: 'bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400',
    glow: 'from-sky-500/10',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400',
    glow: 'from-amber-500/10',
  },
  violet: {
    tile: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400',
    glow: 'from-violet-500/10',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400',
    glow: 'from-rose-500/10',
  },
  slate: {
    tile: 'bg-slate-500/10 text-slate-600 ring-slate-500/15 dark:text-slate-300',
    glow: 'from-slate-500/10',
  },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  tone?: Tone;
  href?: string;
  className?: string;
  footer?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = 'primary',
  href,
  className,
  footer,
}: StatCardProps) {
  const styles = toneStyles[tone];

  const card = (
    <Card
      className={cn(
        'group relative gap-0 overflow-hidden border-border/60 p-5 transition-all duration-300',
        href && 'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-300',
          styles.glow,
          href ? 'opacity-70 group-hover:opacity-100' : 'opacity-60',
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105',
            styles.tile,
          )}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
      </div>
      {(trend || footer) && (
        <div className="relative mt-4 flex items-center gap-2 border-t border-border/50 pt-3 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                trend.direction === 'up'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {trend.value}
            </span>
          )}
          {footer && <span className="text-muted-foreground">{footer}</span>}
        </div>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} prefetch className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-2xl">
        {card}
      </Link>
    );
  }

  return card;
}
