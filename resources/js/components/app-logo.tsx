import AppLogoIcon from './app-logo-icon';
import { cn } from '@/lib/utils';

export default function AppLogo({ compact = false }: { compact?: boolean }) {
    return (
        <>
            <div
                className={cn(
                    'relative flex aspect-square size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_6px_16px_-6px_rgba(16,185,129,.65),inset_0_1px_0_rgba(255,255,255,.28)]',
                )}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_55%)]" />
                <AppLogoIcon className="relative size-5 fill-current" />
            </div>
            {!compact && (
                <div className="ml-2.5 grid flex-1 text-left">
                    <span className="truncate text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">
                        Warehouse 3.0
                    </span>
                </div>
            )}
        </>
    );
}
