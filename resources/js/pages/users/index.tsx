"use client";

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Users', href: '/users' },
];

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  roles?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

interface UserForm extends Partial<User> {
  password?: string;
  password_confirmation?: string;
}

const baseFields: { name: keyof UserForm; label: string; type?: string; placeholder?: string; full?: boolean }[] = [
  { name: 'username', label: 'Username', placeholder: 'jdoe' },
  { name: 'name', label: 'Full name', placeholder: 'Jane Doe' },
  { name: 'email', label: 'Email address', type: 'email', placeholder: 'jane@company.com' },
  { name: 'store_name', label: 'Store name', placeholder: 'AquaVita Store' },
  { name: 'store_phone', label: 'Store phone', placeholder: '+254 700 000 000' },
  { name: 'store_address', label: 'Store address', placeholder: 'Nairobi, Kenya', full: true },
  { name: 'store_email', label: 'Store email', type: 'email', placeholder: 'store@company.com' },
  { name: 'email_verified_at', label: 'Email verified at', type: 'datetime-local' },
  { name: 'photo', label: 'Photo URL', placeholder: 'https://…', full: true },
];

function initials(name?: string) {
  return (
    (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UsersPage() {
  const { users, auth } = usePage<SharedData & { users: User[] }>().props;

  const [filter, setFilter] = React.useState('');
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [creatingUser, setCreatingUser] = React.useState(false);
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
  const [formValues, setFormValues] = React.useState<UserForm>({});
  const [processing, setProcessing] = React.useState(false);

  const role = String(auth?.user?.roles ?? '');
  const canManage = !['operations', 'finance', 'callcenter1', ''].includes(role);

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    const term = filter.toLowerCase();
    return users.filter(
      (u) =>
        (u.name?.toLowerCase() || '').includes(term) ||
        (u.username?.toLowerCase() || '').includes(term) ||
        (u.email?.toLowerCase() || '').includes(term) ||
        (u.store_name?.toLowerCase() || '').includes(term),
    );
  }, [users, filter]);

  const verifiedCount = React.useMemo(
    () => (users || []).filter((user) => Boolean(user.email_verified_at)).length,
    [users],
  );

  const handleCreate = () => {
    const missingFields = [
      !formValues.name?.trim() && 'Name',
      !formValues.email?.trim() && 'Email',
      !formValues.roles && 'Role',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    const payload: UserForm = { ...formValues };
    if (payload.email_verified_at) {
      payload.email_verified_at = payload.email_verified_at.replace('T', ' ') + ':00';
    }
    if (!payload.password) {
      payload.password = 'password123';
      payload.password_confirmation = 'password123';
    }
    setProcessing(true);
    router.post('/users', payload as any, {
      preserveState: true,
      onSuccess: () => {
        setCreatingUser(false);
        setFormValues({});
        toast.success('User created successfully');
        router.reload({ only: ['users'] });
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not create user'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleEditSave = () => {
    if (!editingUser) return;
    const missingFields = [
      !formValues.name?.trim() && 'Name',
      !formValues.email?.trim() && 'Email',
      !formValues.roles && 'Role',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    const payload: UserForm = { ...formValues };
    if (payload.email_verified_at) {
      payload.email_verified_at = payload.email_verified_at.replace('T', ' ') + ':00';
    }
    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    setProcessing(true);
    router.put(`/users/${editingUser.id}`, payload as any, {
      preserveState: true,
      onSuccess: () => {
        setEditingUser(null);
        setFormValues({});
        toast.success('User updated successfully');
        router.reload({ only: ['users'] });
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not update user'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    setProcessing(true);
    router.post(
      `/users/${deletingUser.id}`,
      { _method: 'DELETE' },
      {
        preserveState: true,
        onSuccess: () => {
          setDeletingUser(null);
          toast.success('User deleted successfully');
          router.reload({ only: ['users'] });
        },
        onError: () => toast.error('Could not delete user'),
        onFinish: () => setProcessing(false),
      },
    );
  };

  const openCreate = () => {
    setCreatingUser(true);
    setFormValues({});
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormValues(user);
  };

  const closeForm = () => {
    setCreatingUser(false);
    setEditingUser(null);
    setFormValues({});
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Administration"
          title="Team & access"
          description="Manage the people who operate AquaVita, their roles and the stores they are responsible for."
          icon={Users}
          actions={
            canManage ? (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="size-4" />
                New user
              </Button>
            ) : undefined
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile icon={Users} label="Team members" value={users?.length ?? 0} tone="text-sky-600 dark:text-sky-400" />
          <SummaryTile icon={ShieldCheck} label="Verified accounts" value={verifiedCount} tone="text-emerald-600 dark:text-emerald-400" />
          <SummaryTile icon={UserRound} label="Unverified" value={(users?.length ?? 0) - verifiedCount} tone="text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or store..."
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="w-fit bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users?.length ?? 0} users
          </Badge>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filter ? 'No users match your search' : 'No users yet'}
            description={
              filter
                ? 'Try a different name, email or store.'
                : 'Invite your first teammate to start collaborating.'
            }
            action={
              filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>
                  Clear search
                </Button>
              ) : canManage ? (
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="size-4" />
                  New user
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="group gap-0 overflow-hidden border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-sm">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold tracking-tight">{user.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  {user.roles ? (
                    <StatusBadge status={user.roles} />
                  ) : (
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      No role
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="size-3.5 shrink-0" />
                    {user.email}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <Store className="size-3.5 shrink-0" />
                    {user.store_name || 'No store assigned'}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <Phone className="size-3.5 shrink-0" />
                    {user.store_phone || 'No phone'}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <MapPin className="size-3.5 shrink-0" />
                    {user.store_address || 'No address'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Joined {formatDate(user.created_at)}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => openEdit(user)}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${user.name}`}
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={creatingUser || !!editingUser}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creatingUser ? 'Create user' : 'Edit user'}</DialogTitle>
            <DialogDescription>
              {creatingUser
                ? 'Add a teammate and assign their access role.'
                : 'Update this teammate’s profile, store details and role.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {baseFields.map((field) => (
              <div key={field.name} className={field.full ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
                <Label htmlFor={`user-${field.name}`}>{field.label}</Label>
                <Input
                  id={`user-${field.name}`}
                  type={field.type || 'text'}
                  required={field.name === 'name' || field.name === 'email'}
                  value={String((formValues as Record<string, unknown>)[field.name] ?? '')}
                  onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={formValues.roles || ''}
                onValueChange={(value) => setFormValues({ ...formValues, roles: value })}
              >
                <SelectTrigger id="user-role" aria-required="true">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="superadmin">superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-password">Password{!creatingUser && ' (leave blank to keep)'}</Label>
              <Input
                id="user-password"
                type="password"
                value={formValues.password || ''}
                onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                placeholder={creatingUser ? 'Defaults to password123' : 'Unchanged'}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password-confirmation">Confirm password</Label>
              <Input
                id="user-password-confirmation"
                type="password"
                value={formValues.password_confirmation || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, password_confirmation: e.target.value })
                }
                placeholder="Repeat password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={creatingUser ? handleCreate : handleEditSave} loading={processing}>
              {processing ? 'Saving…' : creatingUser ? 'Create user' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={processing}>
              {processing ? 'Deleting…' : 'Delete user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
      <span className={`flex size-10 items-center justify-center rounded-xl bg-muted/60 ${tone}`}>
        <Icon className="size-4.5" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
