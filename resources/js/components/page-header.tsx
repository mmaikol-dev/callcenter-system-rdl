import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  eyebrow,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('animate-fade-up', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="relative hidden size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-primary shadow-[inset_0_1px_0_rgba(255,255,255,.35)] sm:flex">
              <Icon className="size-6" strokeWidth={1.8} />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[28px]">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
