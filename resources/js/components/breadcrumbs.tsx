import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';
import { Fragment } from 'react';

const resolveHref = (href: string) => (href === '/dashboard' ? '/waredash' : href);

export function Breadcrumbs({ breadcrumbs }: { breadcrumbs: BreadcrumbItemType[] }) {
    return (
        <>
            {breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList className="gap-1.5 text-[13px] sm:gap-2">
                        <BreadcrumbItem className="hidden sm:inline-flex">
                            <BreadcrumbLink asChild>
                                <Link href="/waredash" className="flex items-center text-muted-foreground/70 hover:text-foreground">
                                    <Home className="size-3.5" />
                                    <span className="sr-only">Home</span>
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden sm:block" />
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <Fragment key={`${item.title}-${index}`}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage className="max-w-[160px] truncate font-semibold sm:max-w-none">
                                                {item.title}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link
                                                    href={resolveHref(item.href)}
                                                    className="max-w-[120px] truncate text-muted-foreground hover:text-foreground sm:max-w-none"
                                                >
                                                    {item.title}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
