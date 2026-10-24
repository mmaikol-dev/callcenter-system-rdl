import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import { format } from 'date-fns'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Reports', href: '/report' },
]

const statuses = [
  'Pending',
  'Delivered',
  'Cancelled',
  'Rescheduled',
  'Scheduled',
  'Dispatched',
  'Followup',
  'Returned',
]

interface OrdersFilterCardProps {
  merchants: string[]
}

export default function OrdersFilterCard({ merchants = [] }: OrdersFilterCardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [merchant, setMerchant] = useState<string | null>(null)
  const [status, setStatus] = useState<string[]>([])
  const [merchantOpen, setMerchantOpen] = useState(false)

  const toggleStatus = (value: string) => {
    setStatus((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    )
  }

  const resetFilters = () => {
    setDateRange(undefined)
    setMerchant(null)
    setStatus([])
  }

  const generateReport = () => {
    const params = new URLSearchParams()

    if (merchant) params.append('merchant', merchant)
    status.forEach((item) => params.append('statuses[]', item))
    if (dateRange?.from) params.append('from', dateRange.from.toISOString())
    if (dateRange?.to) params.append('to', dateRange.to.toISOString())

    const link = document.createElement('a')
    link.href = `/report/download?${params.toString()}`
    link.setAttribute('download', 'orders_report.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const activeCount = [dateRange?.from, dateRange?.to, merchant, status.length ? 'statuses' : ''].filter(Boolean).length

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'MMM dd, y')} — ${format(dateRange.to, 'MMM dd, y')}`
      : format(dateRange.from, 'MMM dd, y')
    : 'Any delivery date'

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Generate Report" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Finance"
          title="Generate report"
          description="Build a focused Excel export of orders by date, merchant and status."
          icon={FileSpreadsheet}
          actions={
            activeCount > 0 ? (
              <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={resetFilters}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
            ) : undefined
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="gap-0 overflow-hidden border-border/60">
            <CardHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Filter className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Report filters</CardTitle>
                  <CardDescription>Leave any filter empty to include everything.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 p-5">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-muted-foreground">Delivery date range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start gap-2 text-left font-normal',
                        !dateRange?.from && 'text-muted-foreground',
                      )}
                    >
                      <CalendarDays className="size-4" />
                      {dateLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-muted-foreground">Merchant</Label>
                <Popover open={merchantOpen} onOpenChange={setMerchantOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={merchantOpen}
                      className={cn(
                        'w-full justify-between font-normal',
                        !merchant && 'text-muted-foreground',
                      )}
                    >
                      {merchant || 'All merchants'}
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search merchants..." />
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setMerchant(null)
                              setMerchantOpen(false)
                            }}
                          >
                            <Check className={cn('size-4', merchant ? 'opacity-0' : 'opacity-100')} />
                            All merchants
                          </CommandItem>
                          {merchants.map((item) => (
                            <CommandItem
                              key={item}
                              value={item}
                              onSelect={() => {
                                setMerchant(item)
                                setMerchantOpen(false)
                              }}
                            >
                              <Check className={cn('size-4', merchant === item ? 'opacity-100' : 'opacity-0')} />
                              {item}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">Order status</Label>
                  {status.length > 0 && (
                    <button onClick={() => setStatus([])} className="text-xs font-medium text-primary hover:underline">
                      Clear {status.length} selected
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((item) => {
                    const selected = status.includes(item)
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStatus(item)}
                        className={cn('gap-1.5', !selected && 'text-muted-foreground')}
                      >
                        {selected && <Check className="size-3.5" />}
                        {item}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </CardContent>

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} applied` : 'No filters selected'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFilters}>Clear</Button>
                <Button onClick={generateReport} className="gap-2">
                  <Download className="size-4" />
                  Generate report
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="gap-0 overflow-hidden border-border/60">
              <CardHeader className="border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Report summary</CardTitle>
                    <CardDescription>What will be included</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5 text-sm">
                <SummaryRow label="Format" value={<Badge variant="outline">Excel .xlsx</Badge>} />
                <SummaryRow label="Date range" value={dateLabel} />
                <SummaryRow label="Merchant" value={merchant || 'All merchants'} />
                <SummaryRow label="Statuses" value={status.length ? status.join(', ') : 'All statuses'} />
              </CardContent>
            </Card>

            <Card className="border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card">
              <CardContent className="p-5">
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Built for reconciliation</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Exports include order numbers, clients, products, agents, merchants, delivery dates and payment status.
                </p>
                <div className="mt-4 space-y-2">
                  {['Order-level detail', 'Delivery and payment status', 'Ready for Excel or Sheets'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[190px] text-right font-medium">{value}</span>
    </div>
  )
}
