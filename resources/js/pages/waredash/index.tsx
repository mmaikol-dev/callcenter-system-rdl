"use client"

import AppLayout from '@/layouts/app-layout'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Head, usePage, Link } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, YAxis } from "recharts"
import {
  TrendingUp, Package, Barcode, Truck, Layers, AlertTriangle, AlertOctagon,
  Boxes, ArrowRight, Plus, ScanLine, SendToBack, Activity,
  PackageCheck, Clock3, Sparkles,
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DashboardProps {
  [key: string]: unknown
  userName: string
  summary: {
    totalProducts: number
    totalBarcodes: number
    totalTransfers: number
    totalStock: number
  }
  transfersByRegion: { region: string, total: number }[]
  scansByOperation: { operation_type: string, total: number }[]
  recentScans: any[]
  depletedProducts: any[]
  nearDepletedProducts: any[]
}

const quickActions = [
  { title: 'Add product', description: 'Grow the catalogue', href: '/products', icon: Plus },
  { title: 'Scan barcode', description: 'Record movement', href: '/barcode', icon: ScanLine },
  { title: 'New transfer', description: 'Move stock', href: '/transfer', icon: SendToBack },
]

export default function WarehouseDashboard() {
  const {
    userName, summary, transfersByRegion, scansByOperation, recentScans,
    depletedProducts, nearDepletedProducts
  } = usePage<DashboardProps>().props

  const firstName = userName?.split(' ')[0] || 'there'
  const alertCount = (depletedProducts?.length || 0) + (nearDepletedProducts?.length || 0)

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/waredash" }]}>
      <Head title="Warehouse Dashboard" />
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">

        <PageHeader
          eyebrow="Warehouse overview"
          title={`Good to see you, ${firstName}`}
          description="A live view of stock health, transfers and the scans moving through your operation today."
          icon={Activity}
          actions={
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {alertCount > 0 && (
                <Badge variant="warning" className="h-9 justify-center gap-1.5 px-3">
                  <AlertTriangle className="size-3.5" />
                  {alertCount} stock alerts
                </Badge>
              )}
              <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
                <Link href="/products">View inventory</Link>
              </Button>
              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link href="/barcode">
                  <ScanLine className="size-4" />
                  Scan barcode
                </Link>
              </Button>
            </div>
          }
        />

        {/* KPI row */}
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Total products"
            value={summary.totalProducts.toLocaleString()}
            icon={Package}
            hint="Active catalogue lines"
            tone="emerald"
            href="/products"
            trend={{ value: 'Live', direction: 'up' }}
          />
          <StatCard
            label="Barcodes tracked"
            value={summary.totalBarcodes.toLocaleString()}
            icon={Barcode}
            hint="Inbound + outbound scans"
            tone="blue"
            href="/barcode"
            trend={{ value: 'Tracking', direction: 'up' }}
          />
          <StatCard
            label="Transfers"
            value={summary.totalTransfers.toLocaleString()}
            icon={Truck}
            hint="Stock moved to agents"
            tone="violet"
            href="/transfer"
            trend={{ value: 'Settled', direction: 'up' }}
          />
          <StatCard
            label="Stock on hand"
            value={summary.totalStock.toLocaleString()}
            icon={Layers}
            hint="Units across the network"
            tone="amber"
            footer={`${alertCount} item${alertCount === 1 ? '' : 's'} need attention`}
          />
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          {/* Charts */}
          <div className="grid min-w-0 gap-4 xl:col-span-2 xl:grid-cols-2">
            <ChartCard
              title="Transfers by region"
              description="Where stock is moving"
              data={transfersByRegion}
              xKey="region"
              icon={Truck}
            />
            <ChartCard
              title="Scans by operation"
              description="Inbound vs outbound activity"
              data={scansByOperation}
              xKey="operation_type"
              icon={Barcode}
            />
          </div>

          {/* Right rail */}
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="min-w-0 gap-0 overflow-hidden border-border/60 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Quick actions</p>
                    <p className="text-[11px] text-muted-foreground">Keep the day moving</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    prefetch
                    className="group min-w-0 rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/25 hover:bg-card hover:shadow-card"
                  >
                    <action.icon className="mb-2 size-4 text-primary" />
                    <p className="text-xs font-semibold leading-tight">{action.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{action.description}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <StockAlertCard
              title="Depleted stock"
              icon={<AlertOctagon className="size-4" />}
              products={depletedProducts}
              tone="destructive"
              emptyText="No depleted items — nicely done"
            />
            <StockAlertCard
              title="Near depletion"
              icon={<AlertTriangle className="size-4" />}
              products={nearDepletedProducts}
              tone="warning"
              emptyText="All stock levels are stable"
            />
          </div>
        </div>

        {/* Recent scans */}
        <Card className="min-w-0 gap-0 overflow-hidden border-border/60">
          <CardHeader className="flex flex-col items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Boxes className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base">Recent scans</CardTitle>
                <CardDescription className="text-pretty">The latest barcode activity across the warehouse.</CardDescription>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 self-end text-xs sm:self-auto">
              <Link href="/barcode">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentScans.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={ScanLine}
                  title="No scans yet"
                  description="Barcode activity will appear here as soon as your team starts scanning."
                  action={
                    <Button asChild size="sm" className="gap-2">
                      <Link href="/barcode">
                        <ScanLine className="size-4" />
                        Open barcode centre
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/25 hover:bg-muted/25">
                      <TableHead className="pl-5">Barcode</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Scanned by</TableHead>
                      <TableHead className="pr-5 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{scan.barcode}</TableCell>
                        <TableCell className="font-medium">{scan.product_name}</TableCell>
                        <TableCell>
                          <StatusBadge status={scan.operation_type} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{scan.scanned_by}</TableCell>
                        <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                          {new Date(scan.scanned_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

/* ---------------- Components ---------------- */

function StockAlertCard({
  title,
  icon,
  products,
  tone,
  emptyText,
}: {
  title: string
  icon: React.ReactNode
  products: any[]
  tone: 'destructive' | 'warning'
  emptyText: string
}) {
  const iconTone =
    tone === 'destructive'
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'

  return (
    <Card className="min-w-0 gap-0 overflow-hidden border-border/60">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={`flex size-8 items-center justify-center rounded-lg ${iconTone}`}>{icon}</span>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
        <Badge variant={tone === 'destructive' ? 'destructive' : 'warning'} className="tabular-nums">
          {products.length}
        </Badge>
      </CardHeader>
      <CardContent className="max-h-[220px] overflow-auto p-2">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <PackageCheck className="mb-2 size-6 text-emerald-500/70" />
            <p className="text-xs text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href="/products"
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.code || 'No code'}</p>
                  </div>
                  <Badge variant={tone === 'destructive' ? 'destructive' : 'warning'} className="shrink-0 tabular-nums">
                    {product.quantity} left
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  data,
  xKey,
  icon: Icon,
}: {
  title: string
  description: string
  data: any[]
  xKey: string
  icon: any
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Clock3 className="size-4 text-muted-foreground/50" />
      </CardHeader>
      <CardContent className="h-[300px] p-4">
        {data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <TrendingUp className="mb-2 size-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No data available yet</p>
          </div>
        ) : (
          <ChartContainer config={{ total: { label: "Total", color: "var(--chart-1)" } }} className="h-full min-w-0 w-full">
            <BarChart data={data} margin={{ top: 20, right: 8, bottom: 58, left: -16 }}>
                <defs>
                  <linearGradient id={`fill-${xKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  height={64}
                  interval={0}
                  angle={data.length > 3 ? -30 : 0}
                  textAnchor={data.length > 3 ? "end" : "middle"}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                <Bar dataKey="total" fill={`url(#fill-${xKey})`} radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <LabelList position="top" className="fill-muted-foreground" fontSize={10} />
                </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
