import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  completed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  dispatched: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400',
  scheduled: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  followup: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
  returned: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400',
  cancelled: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
  canceled: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
  expired: 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300',
  duplicate: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 dark:text-fuchsia-400',
  'new orders': 'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400',
  inbound: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  outbound: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400',
};

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const label = status?.trim() || 'Unknown';
  const style = statusStyles[label.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border/70';

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-semibold', style, className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
