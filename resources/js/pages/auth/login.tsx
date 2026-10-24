import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout
            title="Welcome back"
            description="Sign in to your workspace to pick up where you left off."
        >
            <Head title="Log in" />

            <Form method="post" action={route('login')} resetOnSuccess={['password']} className="flex flex-col gap-5">
                {({ processing, errors }) => (
                    <>
                        {status && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                {status}
                            </div>
                        )}

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-[13px] font-semibold">
                                    Work email
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="you@company.com"
                                        className="h-11 pl-10"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" className="text-[13px] font-semibold">
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink href={route('password.request')} className="ml-auto text-xs font-semibold" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="h-11 pl-10 pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Checkbox id="remember" name="remember" tabIndex={3} className="rounded-md" />
                                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                                    Keep me signed in for 30 days
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="mt-1 w-full gap-2 text-sm font-semibold"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/60" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                    Secure access
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <LockKeyhole className="size-3.5 text-emerald-500" />
                            Protected by encrypted sessions and role-based permissions
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
