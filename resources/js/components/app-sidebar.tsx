import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { CommandPaletteTrigger } from '@/components/command-palette';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { getNavigationForUser } from '@/components/navigation';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
  const { auth } = usePage<{ auth: { user: { roles?: string } } }>().props;
  const sections = getNavigationForUser(auth.user.roles);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-12 rounded-xl hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent">
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="group-data-[collapsible=icon]:hidden">
          <CommandPaletteTrigger className="mt-1 w-full border-sidebar-border/70 bg-sidebar-accent/40 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-custom gap-0 overflow-y-auto px-1 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="px-2 py-1">
            <SidebarGroupLabel className="h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/35">
              {section.label}
            </SidebarGroupLabel>
            <NavMain items={section.items} />
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
