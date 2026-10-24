import { Breadcrumbs } from '@/components/breadcrumbs';
import { CommandPaletteTrigger } from '@/components/command-palette';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl transition-[width,height] ease-linear md:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 size-8 rounded-lg text-muted-foreground hover:text-foreground" />
                <Separator orientation="vertical" className="mr-1 h-5 bg-border/70" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <CommandPaletteTrigger className="hidden lg:inline-flex" />
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
