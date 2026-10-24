import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    className,
}: {
    user: User;
    showEmail?: boolean;
    className?: string;
}) {
    const getInitials = useInitials();
    const role = (user as any)?.roles as string | undefined;

    return (
        <>
            <Avatar
                className={cn(
                    'h-9 w-9 overflow-hidden rounded-xl ring-2 ring-sidebar-primary/25 ring-offset-2 ring-offset-sidebar',
                    className,
                )}
            >
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-400/90 to-teal-600 text-xs font-bold text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs capitalize text-sidebar-foreground/45">
                    {showEmail ? user.email : role || 'Team member'}
                </span>
            </div>
        </>
    );
}
