import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Head, router } from '@inertiajs/react'
import {
  Award,
  Calendar,
  DollarSign,
  Filter,
  LineChart as LineChartIcon,
  MapPin,
  Package,
  PieChart as PieChartIcon,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6', '#ec4899']

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Analytics', href: '/stats' },
]

interface Summary {
  totalOrders: number
  totalRevenue: number | string
  averageOrderValue?: number | string
  totalQuantity: number
}

interface AgentPerformance {
  cc_email: string
  total_orders: number
  delivered_orders: number
  pending_orders: number
  cancelled_orders: number
  delivery_rate: number
  total_revenue: number | string
  avg_order_value: number | string
}

interface StatusRow {
  status: string
  total: number
  percentage: number
}

interface MerchantRow {
  merchant: string
  total: number
}

interface DailyRow {
  date: string
  orders: number
  delivered: number
  revenue: number
}

interface ProductRow {
  product_name: string
  total: number
  quantity: number
  revenue: number | string
}

interface CountryRow {
  country: string
  total: number
}

interface RecentOrder {
  id: number
  order_no: string
  client_name: string
  product_name: string
  cc_email: string
  merchant: string
  status: string
  quantity: number
  amount: number | string
  order_date: string
}

interface FilterOptions {
  ccEmails: string[]
  merchants: string[]
  statuses: string[]
  countries: string[]
}

interface Filters {
  date_range?: string
  cc_email?: string
  merchant?: string
  status?: string
  country?: string
}

interface StatsProps {
  summary: Summary
  ordersByStatus: StatusRow[]
  agentPerformance: AgentPerformance[]
  ordersByMerchant: MerchantRow[]
  dailyTrend: DailyRow[]
  topProducts: ProductRow[]
  ordersByCountry: CountryRow[]
  ordersByCity: CountryRow[]
  recentOrders: RecentOrder[]
  filterOptions: FilterOptions
  filters: Filters
}

const dateOptions = [
  { value: 'all_time', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
]

export default function StatsDashboard({
  summary,
  ordersByStatus,
  agentPerformance,
  ordersByMerchant,
  dailyTrend,
  topProducts,
  ordersByCountry,
  recentOrders,
  filterOptions,
  filters,
}: StatsProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters: Record<string, string> = { ...(filters as Record<string, string>) }
    newFilters[key] = value
    Object.keys(newFilters).forEach((k) => {
      if (!newFilters[k] || (k === 'date_range' && newFilters[k] === 'all_time')) delete newFilters[k]
    })
    router.get('/stats', newFilters, {
      preserveState: true,
      preserveScroll: true,
      only: [
        'summary',
        'ordersByStatus',
        'agentPerformance',
        'ordersByMerchant',
        'dailyTrend',
        'topProducts',
        'ordersByCountry',
        'ordersByCity',
        'recentOrders',
        'filters',
      ],
    })
  }

  const clearFilter = (key: keyof Filters) => handleFilterChange(key, '')
  const clearAllFilters = () =>
    router.get('/stats', {}, { preserveState: true, preserveScroll: true })

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && !(key === 'date_range' && value === 'all_time'),
  ).length

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30'

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analytics" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Overview"
          title="Analytics"
          description="Understand orders, revenue and team performance across every merchant and agent."
          icon={TrendingUp}
          actions={
            <>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" className="gap-2 text-xs" onClick={clearAllFilters}>
                  <X className="size-3.5" />
                  Clear filters
                </Button>
              )}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setShowFilters((value) => !value)}
              >
                <Filter className="size-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="h-5 min-w-5 justify-center rounded-full bg-background/20 px-1.5 text-[10px] text-current">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </>
          }
        />

        {showFilters && (
          <Card className="gap-0 overflow-hidden border-border/60">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <CardTitle className="text-base">Filter analytics</CardTitle>
                <CardDescription>Narrow the dashboard to a date range, agent, merchant or status.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowFilters(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <FilterField label="Date range" icon={Calendar}>
                  <select
                    value={filters.date_range || 'all_time'}
                    onChange={(e) => handleFilterChange('date_range', e.target.value)}
                    className={selectClass}
                  >
                    {dateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Agent" icon={Users}>
                  <select
                    value={filters.cc_email || ''}
                    onChange={(e) => handleFilterChange('cc_email', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All agents ({filterOptions.ccEmails.length})</option>
                    {filterOptions.ccEmails.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Merchant" icon={Store}>
                  <select
                    value={filters.merchant || ''}
                    onChange={(e) => handleFilterChange('merchant', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All merchants ({filterOptions.merchants.length})</option>
                    {filterOptions.merchants.map((merchant) => (
                      <option key={merchant} value={merchant}>
                        {merchant}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Status" icon={Package}>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All statuses ({filterOptions.statuses.length})</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Country" icon={MapPin}>
                  <select
                    value={filters.country || ''}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All countries ({filterOptions.countries.length})</option>
                    {filterOptions.countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </FilterField>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                  {filters.date_range && filters.date_range !== 'all_time' && (
                    <FilterBadge label="Date" value={filters.date_range.replace(/_/g, ' ')} onClear={() => clearFilter('date_range')} />
                  )}
                  {filters.cc_email && <FilterBadge label="Agent" value={filters.cc_email} onClear={() => clearFilter('cc_email')} />}
                  {filters.merchant && <FilterBadge label="Merchant" value={filters.merchant} onClear={() => clearFilter('merchant')} />}
                  {filters.status && <FilterBadge label="Status" value={filters.status} onClear={() => clearFilter('status')} />}
                  {filters.country && <FilterBadge label="Country" value={filters.country} onClear={() => clearFilter('country')} />}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total orders"
            value={summary.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            hint="Across all merchants"
            tone="blue"
            trend={{ value: 'Live', direction: 'up' }}
          />
          <StatCard
            label="Total revenue"
            value={`Ksh ${Number(summary.totalRevenue).toLocaleString()}`}
            icon={DollarSign}
            hint="Captured order value"
            tone="emerald"
            trend={{ value: 'Revenue', direction: 'up' }}
          />
          <StatCard
            label="Avg order value"
            value={`Ksh ${Number(summary.averageOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            hint="Per completed order"
            tone="violet"
          />
          <StatCard
            label="Items moved"
            value={summary.totalQuantity.toLocaleString()}
            icon={Package}
            hint="Total quantity ordered"
            tone="amber"
          />
        </div>

        <Card className="gap-0 overflow-hidden border-border/60">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">Agent performance</CardTitle>
                <CardDescription>Delivery rates and revenue by call-centre agent.</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-card text-xs text-muted-foreground">
              {agentPerformance.length} agents
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {agentPerformance.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Users} title="No agent data" description="Performance will appear once orders are assigned to agents." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/25 hover:bg-muted/25">
                      <TableHead className="pl-5">Agent</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Cancelled</TableHead>
                      <TableHead>Delivery rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="pr-5 text-right">Avg order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.map((agent, index) => (
                      <TableRow key={agent.cc_email}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2">
                            {index < 3 && <Award className="size-4 text-amber-500" />}
                            <span className="font-medium">{agent.cc_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{agent.total_orders}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                          {agent.delivered_orders}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600 tabular-nums dark:text-amber-400">
                          {agent.pending_orders}
                        </TableCell>
                        <TableCell className="text-right font-medium text-rose-600 tabular-nums dark:text-rose-400">
                          {agent.cancelled_orders}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${
                                  agent.delivery_rate >= 80
                                    ? 'bg-emerald-500'
                                    : agent.delivery_rate >= 60
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(agent.delivery_rate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{agent.delivery_rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          Ksh {Number(agent.total_revenue).toLocaleString()}
                        </TableCell>
                        <TableCell className="pr-5 text-right text-muted-foreground tabular-nums">
                          Ksh {Number(agent.avg_order_value).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Daily trend" description="Orders, deliveries and revenue over time" icon={LineChartIcon}>
            {dailyTrend.length === 0 ? (
              <ChartEmpty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) =>
                      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
                    labelFormatter={(date: string) => new Date(date).toLocaleDateString()}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Orders" />
                  <Line yAxisId="left" type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} dot={false} name="Delivered" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Orders by status" description="Where orders currently sit" icon={PieChartIcon}>
            {ordersByStatus.length === 0 ? (
              <ChartEmpty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: unknown) => {
                      const row = entry as StatusRow
                      return `${row.status}: ${row.percentage}%`
                    }}
                    outerRadius={95}
                    innerRadius={48}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${entry.status}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Orders by merchant" description={`${ordersByMerchant.length} merchants`} icon={Store}>
            {ordersByMerchant.length === 0 ? (
              <ChartEmpty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByMerchant} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="merchant" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={70} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Orders by country" description="Geographic distribution" icon={MapPin}>
            {ordersByCountry.length === 0 ? (
              <ChartEmpty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByCountry} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DataCard title="Top products" description="Best sellers by order volume" icon={Package}>
            {topProducts.length === 0 ? (
              <div className="p-5"><EmptyState icon={Package} title="No product data" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/25 hover:bg-muted/25">
                    <TableHead className="pl-5">Product</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="pr-5 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.product_name}>
                      <TableCell className="pl-5 font-medium">{product.product_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{product.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{product.quantity}</TableCell>
                      <TableCell className="pr-5 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        Ksh {Number(product.revenue).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataCard>

          <DataCard title="Recent orders" description="Latest order activity" icon={ShoppingCart}>
            {recentOrders.length === 0 ? (
              <div className="p-5"><EmptyState icon={ShoppingCart} title="No recent orders" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/25 hover:bg-muted/25">
                    <TableHead className="pl-5">Order</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium text-primary">{order.order_no}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(order.order_date).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{order.client_name}</p>
                        <p className="text-[10px] text-muted-foreground">{order.merchant}</p>
                      </TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="pr-5 text-right font-semibold tabular-nums">Ksh {order.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataCard>
        </div>
      </div>
    </AppLayout>
  )
}

function FilterField({ label, icon: Icon, children }: { label: string; icon: typeof Calendar; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </label>
      {children}
    </div>
  )
}

function FilterBadge({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 py-1 text-primary">
      <span className="font-medium">{label}:</span>
      <span className="capitalize">{value}</span>
      <button onClick={onClear} className="rounded-full p-0.5 transition-colors hover:bg-primary/15" aria-label={`Clear ${label}`}>
        <X className="size-3" />
      </button>
    </Badge>
  )
}

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof LineChartIcon
  children: React.ReactNode
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[320px] p-4">{children}</CardContent>
    </Card>
  )
}

function DataCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Package
  children: React.ReactNode
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="max-h-[360px] overflow-auto p-0">{children}</CardContent>
    </Card>
  )
}

function ChartEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <LineChartIcon className="mb-2 size-7 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">No data for this period</p>
    </div>
  )
}
