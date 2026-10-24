"use client";

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Boxes, CalendarDays, Edit3, Hash, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Unit {
  id: number;
  name: string;
  slug: string;
  short_code: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  units: Unit[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Units', href: '/units' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Units({ units }: Props) {
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newUnit, setNewUnit] = useState({ name: '', short_code: '' });
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const { auth } = usePage<SharedData>().props;
  const role = String(auth?.user?.roles ?? '');
  const canManage = !['operations', 'finance', 'callcenter1', ''].includes(role);

  const handleCreate = () => {
    if (!newUnit.name.trim() || !newUnit.short_code.trim()) {
      const missingFields = [
        !newUnit.name.trim() && 'Unit name',
        !newUnit.short_code.trim() && 'Short code',
      ].filter(Boolean);
      toast.error(`${missingFields.join(' and ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    setProcessing(true);
    router.post('/units', newUnit, {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        setNewUnit({ name: '', short_code: '' });
        toast.success('Unit created successfully');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not create unit'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleUpdate = () => {
    if (!editUnit) return;
    setProcessing(true);
    router.put(
      `/units/${editUnit.id}`,
      { name: editUnit.name, short_code: editUnit.short_code },
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowEdit(false);
          setEditUnit(null);
          toast.success('Unit updated successfully');
        },
        onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not update unit'),
        onFinish: () => setProcessing(false),
      },
    );
  };

  const handleDelete = () => {
    if (deleteUnitId === null) return;
    setProcessing(true);
    router.delete(`/units/${deleteUnitId}`, {
      preserveScroll: true,
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeleteUnitId(null);
        toast.success('Unit deleted successfully');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not delete unit'),
      onFinish: () => setProcessing(false),
    });
  };

  const filteredUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(filter.toLowerCase()) ||
      unit.short_code.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Units" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Catalogue"
          title="Units"
          description="Define the measurement units your products use, from bottles and cartons to pallets."
          icon={Boxes}
          actions={
            canManage ? (
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="size-4" />
                New unit
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search units by name or code..."
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Boxes className="size-3.5" />
            {filteredUnits.length} of {units.length} units
          </Badge>
        </div>

        {filteredUnits.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={filter ? 'No units match your search' : 'No units yet'}
            description={
              filter
                ? 'Try a different name or short code.'
                : 'Create your first unit so products can be measured consistently.'
            }
            action={
              filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>
                  Clear search
                </Button>
              ) : canManage ? (
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="size-4" />
                  New unit
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUnits.map((unit) => (
              <Card
                key={unit.id}
                className="group gap-0 overflow-hidden border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                    <Boxes className="size-5" strokeWidth={1.8} />
                  </div>
                  <Badge variant="outline" className="bg-muted/50 font-mono text-[11px]">
                    {unit.short_code || '—'}
                  </Badge>
                </div>

                <div className="mt-4">
                  <h3 className="truncate text-base font-semibold tracking-tight" title={unit.name}>
                    {unit.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Hash className="size-3" />
                    {unit.slug || 'No slug'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {formatDate(unit.created_at)}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${unit.name}`}
                        onClick={() => {
                          setEditUnit(unit);
                          setShowEdit(true);
                        }}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${unit.name}`}
                        onClick={() => {
                          setDeleteUnitId(unit.id);
                          setShowDeleteConfirm(true);
                        }}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create unit</DialogTitle>
            <DialogDescription>Add a new unit of measurement for your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="unit-name">Unit name</Label>
              <Input
                id="unit-name"
                placeholder="e.g. Carton"
                value={newUnit.name}
                required
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit-code">Short code</Label>
              <Input
                id="unit-code"
                placeholder="e.g. CTN"
                value={newUnit.short_code}
                required
                onChange={(e) => setNewUnit({ ...newUnit, short_code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={processing}>
              {processing ? 'Creating…' : 'Create unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit unit</DialogTitle>
            <DialogDescription>Update the unit name or short code.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-name">Unit name</Label>
              <Input
                id="edit-unit-name"
                value={editUnit?.name || ''}
                required
                onChange={(e) =>
                  setEditUnit(editUnit ? { ...editUnit, name: e.target.value } : null)
                }
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit-code">Short code</Label>
              <Input
                id="edit-unit-code"
                value={editUnit?.short_code || ''}
                required
                onChange={(e) =>
                  setEditUnit(editUnit ? { ...editUnit, short_code: e.target.value.toUpperCase() } : null)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={processing}>
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit? Products using it may need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={processing}>
              {processing ? 'Deleting…' : 'Delete unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
