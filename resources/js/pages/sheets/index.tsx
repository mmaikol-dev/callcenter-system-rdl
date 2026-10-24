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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileSpreadsheet,
  Globe2,
  KeyRound,
  LoaderCircle,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Sheets', href: '/sheets' },
];

interface Sheet {
  id: number;
  sheet_id: string;
  sheet_name: string;
  shopify_name: string;
  access_token: string;
  country: string;
  cc_agents: string;
  sku: string;
}

interface SheetDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
}

const sheetFields: { name: keyof Sheet; label: string; placeholder?: string; full?: boolean }[] = [
  { name: 'sheet_name', label: 'Sheet name', placeholder: 'Orders — Nairobi' },
  { name: 'sheet_id', label: 'Sheet ID', placeholder: '1AbC…' },
  { name: 'shopify_name', label: 'Shopify store', placeholder: 'AquaVita KE' },
  { name: 'country', label: 'Country', placeholder: 'Kenya' },
  { name: 'sku', label: 'SKU prefix', placeholder: 'AV' },
  { name: 'access_token', label: 'Access token', placeholder: 'Optional token' },
];

function SheetDataModal({ open, onOpenChange, sheetId }: SheetDataModalProps) {
  const [sheetData, setSheetData] = React.useState<string[][]>([]);
  const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
  const [activeSheet, setActiveSheet] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(
    (sheetName?: string) => {
      setLoading(true);
      setError(null);
      const url = sheetName
        ? `/sheets/${sheetId}/view?sheetName=${encodeURIComponent(sheetName)}`
        : `/sheets/${sheetId}/view`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Could not load this sheet');
          return res.json();
        })
        .then((data) => {
          setSheetData(data.sheetData || []);
          setAvailableSheets(data.availableSheets || []);
          setActiveSheet(sheetName || data.availableSheets?.[0] || '');
        })
        .catch((err: Error) => setError(err.message || 'Could not load this sheet'))
        .finally(() => setLoading(false));
    },
    [sheetId],
  );

  React.useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, fetchData]);

  const activeIndex = availableSheets.indexOf(activeSheet);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[94vw] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Sheet preview</DialogTitle>
          <DialogDescription>Browse tabs and inspect live rows from this connected sheet.</DialogDescription>
        </DialogHeader>

        {availableSheets.length > 0 && (
          <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <Select value={activeSheet} onValueChange={(value) => fetchData(value)}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select a tab" />
              </SelectTrigger>
              <SelectContent>
                {availableSheets.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => activeIndex > 0 && fetchData(availableSheets[activeIndex - 1])}
                disabled={activeIndex <= 0}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() =>
                  activeIndex < availableSheets.length - 1 &&
                  fetchData(availableSheets[activeIndex + 1])
                }
                disabled={activeIndex >= availableSheets.length - 1}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="min-h-[300px] flex-1 overflow-auto rounded-xl border border-border/60">
          {loading ? (
            <div className="flex h-full min-h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading sheet data…
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <FileSpreadsheet className="size-7 text-muted-foreground/50" />
              {error}
              <Button size="sm" variant="outline" onClick={() => fetchData(activeSheet)}>
                Try again
              </Button>
            </div>
          ) : sheetData.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <FileSpreadsheet className="size-7 text-muted-foreground/50" />
              No data found in this sheet.
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                <TableRow className="hover:bg-transparent">
                  {sheetData[0].map((header, index) => (
                    <TableHead key={index} className="whitespace-nowrap text-xs font-semibold">
                      {header || '—'}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetData.slice(1).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap text-xs">
                        {cell || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SheetsView() {
  const { sheets, auth } = usePage<SharedData & { sheets: Sheet[] }>().props;

  const [filter, setFilter] = React.useState('');
  const [editingSheet, setEditingSheet] = React.useState<Sheet | null>(null);
  const [editValues, setEditValues] = React.useState<Partial<Sheet>>({});
  const [deletingSheet, setDeletingSheet] = React.useState<Sheet | null>(null);
  const [creatingSheet, setCreatingSheet] = React.useState(false);
  const [createValues, setCreateValues] = React.useState<Partial<Sheet>>({});
  const [viewModalOpen, setViewModalOpen] = React.useState(false);
  const [viewSheetId, setViewSheetId] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const role = String(auth?.user?.roles ?? '');
  const canManage = !['operations', 'finance', 'callcenter1', ''].includes(role);

  const filteredSheets = React.useMemo(() => {
    if (!sheets) return [];
    const term = filter.toLowerCase();
    return sheets.filter(
      (sheet) =>
        (sheet.sheet_name?.toLowerCase() || '').includes(term) ||
        (sheet.shopify_name?.toLowerCase() || '').includes(term) ||
        (sheet.country?.toLowerCase() || '').includes(term) ||
        (sheet.sku?.toLowerCase() || '').includes(term),
    );
  }, [sheets, filter]);

  const handleEditOpen = (sheet: Sheet) => {
    setEditingSheet(sheet);
    setEditValues(sheet);
  };

  const handleEditSave = () => {
    if (!editingSheet) return;
    if (!editValues.sheet_name?.trim() || !editValues.sheet_id?.trim()) {
      const missing = [
        !editValues.sheet_name?.trim() && 'Sheet name',
        !editValues.sheet_id?.trim() && 'Sheet ID',
      ].filter((field): field is string => Boolean(field));
      toast.error(`${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    setProcessing(true);
    router.put(`/sheets/${editingSheet.id}`, editValues, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingSheet(null);
        toast.success('Sheet updated successfully');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not update sheet.'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleDelete = () => {
    if (!deletingSheet) return;
    setProcessing(true);
    router.delete(`/sheets/${deletingSheet.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeletingSheet(null);
        toast.success('Sheet deleted successfully');
      },
      onError: () => toast.error('Could not delete sheet'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleCreateSave = () => {
    if (!createValues.sheet_name?.trim() || !createValues.sheet_id?.trim()) {
      const missing = [
        !createValues.sheet_name?.trim() && 'Sheet name',
        !createValues.sheet_id?.trim() && 'Sheet ID',
      ].filter((field): field is string => Boolean(field));
      toast.error(`${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} required.`);
      return;
    }
    setProcessing(true);
    router.post('/sheets', createValues, {
      preserveScroll: true,
      onSuccess: () => {
        setCreatingSheet(false);
        setCreateValues({});
        toast.success('Sheet connected successfully');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not create sheet.'),
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sheets" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Integrations"
          title="Connected sheets"
          description="Connect Google Sheets that feed orders into AquaVita and keep every store in sync."
          icon={FileSpreadsheet}
          actions={
            canManage ? (
              <Button onClick={() => setCreatingSheet(true)} className="gap-2">
                <Plus className="size-4" />
                Connect sheet
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sheets, stores or countries..."
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="w-fit bg-card px-3 py-1.5 text-xs text-muted-foreground">
            {filteredSheets.length} of {sheets?.length ?? 0} sheets
          </Badge>
        </div>

        {filteredSheets.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title={filter ? 'No sheets match your search' : 'No sheets connected'}
            description={
              filter
                ? 'Try a different name, store, country or SKU.'
                : 'Connect a Google Sheet to start importing orders automatically.'
            }
            action={
              filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>
                  Clear search
                </Button>
              ) : canManage ? (
                <Button onClick={() => setCreatingSheet(true)} className="gap-2">
                  <Plus className="size-4" />
                  Connect sheet
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSheets.map((sheet) => (
              <Card
                key={sheet.id}
                className="group gap-0 overflow-hidden border-border/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/15 dark:text-emerald-400">
                      <FileSpreadsheet className="size-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold tracking-tight" title={sheet.sheet_name}>
                        {sheet.sheet_name || 'Untitled sheet'}
                      </h3>
                      <p className="truncate font-mono text-[10px] text-muted-foreground" title={sheet.sheet_id}>
                        {sheet.sheet_id}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400">
                    Connected
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                  <InfoRow icon={ShoppingBag} label="Shopify" value={sheet.shopify_name} />
                  <InfoRow icon={Globe2} label="Country" value={sheet.country} />
                  <InfoRow icon={KeyRound} label="SKU" value={sheet.sku} mono />
                  <InfoRow
                    icon={Users}
                    label="Agents"
                    value={sheet.cc_agents ? 'Configured' : 'Not set'}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setViewSheetId(sheet.sheet_id);
                      setViewModalOpen(true);
                    }}
                  >
                    <Eye className="size-3.5" />
                    Preview data
                  </Button>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${sheet.sheet_name}`}
                        onClick={() => handleEditOpen(sheet)}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${sheet.sheet_name}`}
                        onClick={() => setDeletingSheet(sheet)}
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

      <Dialog open={creatingSheet} onOpenChange={(open) => !open && setCreatingSheet(false)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect a sheet</DialogTitle>
            <DialogDescription>Add the sheet details so orders can be imported automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {sheetFields.map((field) => (
              <div key={field.name} className={field.full ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
                <Label htmlFor={`create-${field.name}`}>{field.label}</Label>
                <Input
                  id={`create-${field.name}`}
                  value={String((createValues as Record<string, unknown>)[field.name] ?? '')}
                  required={field.name === 'sheet_name' || field.name === 'sheet_id'}
                  onChange={(e) => setCreateValues({ ...createValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="create-cc_agents">CC agents (JSON)</Label>
              <Textarea
                id="create-cc_agents"
                rows={6}
                className="font-mono text-xs"
                placeholder={'{\n  "Sheet3": ["agent1", "agent2"]\n}'}
                value={createValues.cc_agents || ''}
                onChange={(e) => setCreateValues({ ...createValues, cc_agents: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingSheet(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleCreateSave} disabled={processing}>
              {processing ? 'Connecting…' : 'Connect sheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSheet} onOpenChange={(open) => !open && setEditingSheet(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit sheet</DialogTitle>
            <DialogDescription>Update the connection details for this sheet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {sheetFields.map((field) => (
              <div key={field.name} className={field.full ? 'grid gap-2 sm:col-span-2' : 'grid gap-2'}>
                <Label htmlFor={`edit-${field.name}`}>{field.label}</Label>
                <Input
                  id={`edit-${field.name}`}
                  value={String((editValues as Record<string, unknown>)[field.name] ?? '')}
                  required={field.name === 'sheet_name' || field.name === 'sheet_id'}
                  onChange={(e) => setEditValues({ ...editValues, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="edit-cc_agents">CC agents (JSON)</Label>
              <Textarea
                id="edit-cc_agents"
                rows={6}
                className="font-mono text-xs"
                placeholder={'{\n  "Sheet3": ["agent1", "agent2"]\n}'}
                value={editValues.cc_agents || ''}
                onChange={(e) => setEditValues({ ...editValues, cc_agents: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSheet(null)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={processing}>
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingSheet} onOpenChange={(open) => !open && setDeletingSheet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete sheet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingSheet?.sheet_name}</strong>? Order
              imports from this sheet will stop.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSheet(null)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? 'Deleting…' : 'Delete sheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewSheetId && (
        <SheetDataModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          sheetId={viewSheetId}
        />
      )}
    </AppLayout>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Globe2;
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </p>
      <p className={`mt-0.5 truncate text-xs font-medium ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
