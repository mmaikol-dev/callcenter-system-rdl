import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, router, usePage } from '@inertiajs/react'
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Edit3,
  HandCoins,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const BREADCRUMBS: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Transactions', href: '/transactions' },
]

interface Transaction {
  id: number
  transaction_id: string
  account_number: string
  amount: string
  payer_phone: string
  processed: boolean
  created_at?: string
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface TransactionPaginator {
  data: Transaction[]
  links?: PaginationLink[]
  total?: number
  from?: number | null
  to?: number | null
  current_page?: number
  last_page?: number
}

interface TransactionFilters {
  search?: string
  status?: string
  start_date?: string
  end_date?: string
}

interface TransactionsProps {
  [key: string]: unknown
  transactions: TransactionPaginator | Transaction[]
  auth?: { user?: { roles?: string } }
  filters?: TransactionFilters
}

export default function TransactionsView() {
  const { transactions, auth, filters } = usePage<TransactionsProps>().props
  const userRole = (auth?.user?.roles || '').toLowerCase()

  const paginator = Array.isArray(transactions) ? null : transactions
  const list: Transaction[] = Array.isArray(transactions) ? transactions : transactions?.data || []
  const links: PaginationLink[] = paginator?.links || []

  const [search, setSearch] = useState(filters?.search || '')
  const [status, setStatus] = useState(filters?.status || '')
  const [startDate, setStartDate] = useState(filters?.start_date || '')
  const [endDate, setEndDate] = useState(filters?.end_date || '')

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editValues, setEditValues] = useState<Partial<Transaction>>({})
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  const activeFilterCount = [search, status, startDate, endDate].filter(Boolean).length

  const pageSummary = useMemo(() => {
    const amount = list.reduce((sum, txn) => sum + Number(txn.amount || 0), 0)
    const processed = list.filter((txn) => txn.processed).length
    return { amount, processed, pending: list.length - processed }
  }, [list])

  const queryParams = (overrides: Record<string, string> = {}) => {
    const params: Record<string, string> = {
      search,
      status,
      start_date: startDate,
      end_date: endDate,
      ...overrides,
    }
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key]
    })
    return params
  }

  const applyFilters = () => {
    router.get('/transactions', queryParams(), { preserveState: true, replace: true })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setStartDate('')
    setEndDate('')
    router.get('/transactions', {}, { preserveState: true, replace: true })
  }

  const refresh = () => {
    router.get('/transactions', queryParams(), { preserveScroll: true, replace: true })
  }

  const handleEditOpen = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditValues(transaction)
  }

  const handleEditSave = () => {
    if (!editingTransaction) return
    router.put(`/transactions/${editingTransaction.id}`, editValues, {
      onSuccess: () => setEditingTransaction(null),
      preserveScroll: true,
      preserveState: true,
      only: ['transactions'],
    })
  }

  const handleDelete = () => {
    if (!deletingTransaction) return
    router.delete(`/transactions/${deletingTransaction.id}`, {
      onSuccess: () => setDeletingTransaction(null),
      preserveScroll: true,
      preserveState: true,
      only: ['transactions'],
    })
  }

  if (userRole === 'merchant') {
    return (
      <AppLayout breadcrumbs={BREADCRUMBS}>
        <Head title="Transactions" />
        <div className="p-4 sm:p-6 lg:p-8">
          <EmptyState
            icon={ShieldAlert}
            title="Access not allowed"
            description="You do not have permission to view transactions. Contact an administrator if you believe this is a mistake."
            action={
              <Button variant="outline" onClick={() => router.visit('/waredash')}>
                Back to dashboard
              </Button>
            }
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={BREADCRUMBS}>
      <Head title="Transactions" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Finance"
          title="Transactions"
          description="M-Pesa C2B payments, reconciliation status and payer records."
          icon={HandCoins}
          actions={
            <Button variant="outline" className="gap-2" onClick={refresh}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total records" value={(paginator?.total ?? list.length).toLocaleString()} icon={HandCoins} hint="Matching your filters" tone="primary" />
          <StatCard label="Page value" value={`Ksh ${pageSummary.amount.toLocaleString()}`} icon={Banknote} hint="Amount on this page" tone="emerald" />
          <StatCard label="Processed" value={pageSummary.processed.toLocaleString()} icon={CheckCircle2} hint="On this page" tone="blue" />
          <StatCard label="Pending" value={pageSummary.pending.toLocaleString()} icon={Clock3} hint="Awaiting reconciliation" tone="amber" />
        </div>

        <Card className="gap-0 overflow-hidden border-border/60">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-border/60 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transaction ID, account or phone"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                  className="pl-9"
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-xl border border-border/80 bg-card/50 px-3 text-sm shadow-xs outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/30"
              >
                <option value="">All statuses</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
              </select>

              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full lg:w-40" aria-label="Start date" />
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full lg:w-40" aria-label="End date" />

              <div className="flex items-center gap-2">
                <Button onClick={applyFilters} className="gap-2">
                  <Search className="size-4" />
                  Apply
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={clearFilters}>
                    <X className="size-4" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>

            {list.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={HandCoins}
                  title="No transactions found"
                  description="No payment records match the current search or filters."
                  action={
                    activeFilterCount > 0 ? (
                      <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/25 hover:bg-muted/25">
                      <TableHead className="pl-5">Transaction</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payer phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="pr-5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="pl-5">
                          <p className="max-w-[190px] truncate font-medium" title={txn.transaction_id}>
                            {txn.transaction_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[170px] truncate text-muted-foreground" title={txn.account_number}>
                            {txn.account_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          Ksh {Number(txn.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{txn.payer_phone}</TableCell>
                        <TableCell>
                          <StatusBadge status={txn.processed ? 'Processed' : 'Pending'} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {txn.created_at ? new Date(txn.created_at).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end gap-1.5">
                            <Button size="icon" variant="ghost" className="size-8" onClick={() => handleEditOpen(txn)} title="Edit transaction">
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingTransaction(txn)}
                              title="Delete transaction"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {paginator && links.length > 3 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{paginator.from ?? 0}</span> to{' '}
                  <span className="font-semibold text-foreground">{paginator.to ?? 0}</span> of{' '}
                  <span className="font-semibold text-foreground">{paginator.total ?? list.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  {links.map((link, index) => {
                    const label = link.label.replace(/&laquo;|&raquo;/g, '').trim()
                    if (!label) return null
                    return (
                      <Button
                        key={`${link.label}-${index}`}
                        variant={link.active ? 'default' : 'ghost'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                        className="min-w-8 px-2.5"
                        dangerouslySetInnerHTML={{ __html: label }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Update the payment details for {editingTransaction?.transaction_id}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Field label="Transaction ID">
              <Input value={editingTransaction?.transaction_id || ''} disabled className="font-mono text-xs" />
            </Field>
            <Field label="Account number">
              <Input
                value={editValues.account_number || ''}
                onChange={(event) => setEditValues({ ...editValues, account_number: event.target.value })}
              />
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                value={editValues.amount || ''}
                onChange={(event) => setEditValues({ ...editValues, amount: event.target.value })}
              />
            </Field>
            <Field label="Payer phone">
              <Input
                value={editValues.payer_phone || ''}
                onChange={(event) => setEditValues({ ...editValues, payer_phone: event.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={!!editValues.processed}
                onChange={(event) => setEditValues({ ...editValues, processed: event.target.checked })}
              />
              Mark as processed
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deletingTransaction?.transaction_id}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
