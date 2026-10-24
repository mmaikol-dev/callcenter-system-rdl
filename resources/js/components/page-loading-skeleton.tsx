import { Skeleton } from '@/components/ui/skeleton';

export function PageLoadingSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading page"
            aria-live="polite"
            className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"
        >
            <div className="space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-28 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="space-y-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}
