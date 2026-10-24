import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PageLoadingSkeleton } from '@/components/page-loading-skeleton';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useEffect, useState, type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', (event) => {
            const isPartialReload = Boolean(event.detail.visit.only?.length);
            setIsLoading(event.detail.visit.method === 'get' && !isPartialReload);
        });
        const removeFinishListener = router.on('finish', () => setIsLoading(false));
        const removeCancelListener = router.on('cancel', () => setIsLoading(false));

        return () => {
            removeStartListener();
            removeFinishListener();
            removeCancelListener();
        };
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {isLoading ? <PageLoadingSkeleton /> : children}
            </AppContent>
        </AppShell>
    );
}
