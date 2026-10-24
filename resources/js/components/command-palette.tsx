import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import {
  LogOut,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getNavigationForUser } from './navigation';

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { appearance, updateAppearance } = useAppearance();
  const { auth } = usePage<{ auth: { user: { roles?: string } } }>().props;
  const sections = getNavigationForUser(auth.user.roles);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    window.setTimeout(command, 60);
  }, []);

  const toggleTheme = () => {
    updateAppearance(appearance === 'dark' ? 'light' : 'dark');
  };

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, tools and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {sections.map((section, index) => (
            <div key={section.label}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={section.label}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${item.description ?? ''} ${(item.keywords ?? []).join(' ')}`}
                    onSelect={() => runCommand(() => router.visit(item.href))}
                  >
                    <item.icon className="text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      {item.description && (
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="theme dark light appearance" onSelect={() => runCommand(toggleTheme)}>
              {appearance === 'dark' ? (
                <Sun className="text-muted-foreground" />
              ) : (
                <Moon className="text-muted-foreground" />
              )}
              <span>{appearance === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
            </CommandItem>
            <CommandItem
              value="logout sign out"
              onSelect={() => runCommand(() => router.post(route('logout')))}
            >
              <LogOut className="text-muted-foreground" />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'group inline-flex h-9 items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3 text-sm text-muted-foreground shadow-xs transition-all hover:border-border hover:bg-card hover:text-foreground',
        className,
      )}
    >
      <Search className="size-4" />
      <span className="hidden md:inline">Search anything…</span>
      <span className="ml-1 hidden items-center gap-1 rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
        <span className="text-xs">⌘</span>K
      </span>
    </button>
  );
}
