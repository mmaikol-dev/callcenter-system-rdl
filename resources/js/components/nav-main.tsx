import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import type { NavEntry } from './navigation';

export function NavMain({ items = [] }: { items: NavEntry[] }) {
    const page = usePage();

    return (
        <SidebarMenu className="gap-1">
            {items.map((item) => {
                const active = page.url === item.href || page.url.startsWith(`${item.href}/`);
                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={{ children: item.title }}
                            className="group/nav relative h-10 rounded-xl px-3 text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-gradient-to-r data-[active=true]:from-sidebar-primary/20 data-[active=true]:to-transparent data-[active=true]:text-sidebar-foreground"
                        >
                            <Link href={item.href} prefetch>
                                <span
                                    className={
                                        active
                                            ? 'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary shadow-[0_0_12px_color-mix(in_oklch,var(--sidebar-primary)_70%,transparent)]'
                                            : 'absolute left-0 top-1/2 h-5 w-0 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all duration-200 group-hover/nav:w-0.5 group-hover/nav:bg-sidebar-foreground/25'
                                    }
                                />
                                {item.icon && (
                                    <item.icon
                                        className={
                                            active
                                                ? 'text-sidebar-primary'
                                                : 'text-sidebar-foreground/45 transition-colors group-hover/nav:text-sidebar-foreground/80'
                                        }
                                        strokeWidth={1.9}
                                    />
                                )}
                                <span className="truncate font-medium">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
