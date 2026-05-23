"use client"

import { useMemo, type ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  buildChartConfigFromRows,
  DocumentExpiryBarItem,
  ExpiryTimelineItem,
  toChartData,
  toChartRows,
} from "@/lib/document-expiry-analytics"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Reusable chart card wrapper ─────────────────────────────────────────────

function ChartCard({
  title,
  description,
  isLoading,
  children,
  className,
}: {
  title: string
  description?: string
  isLoading?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`flex h-full flex-col ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pt-0">
        {isLoading ? (
          <Skeleton className="h-[220px] w-full rounded-lg" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// ─── Donut Status Chart ───────────────────────────────────────────────────────

function DonutStatusChart({
  items,
  isLoading,
}: {
  items: DocumentExpiryBarItem[]
  isLoading?: boolean
}) {
  const rows = useMemo(() => toChartRows(items), [items])
  const chartConfig = useMemo(() => buildChartConfigFromRows(rows), [rows])
  const pieData = useMemo(
    () => rows.map((r) => ({ name: r.label, value: r.value, fill: r.fill, chartKey: r.chartKey })),
    [rows]
  )
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <ChartCard
      title="Status overview"
      description="Distribution across expiry states."
      isLoading={isLoading}
    >
      {!items.length || total === 0 ? (
        <p className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
          Add documents to see status breakdown.
        </p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-square h-[min(260px,44vh)] w-full"
          initialDimension={{ width: 300, height: 260 }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="78%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry) => (
                <Cell key={entry.chartKey} fill={entry.fill} strokeWidth={0} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 22}
                          className="fill-muted-foreground text-xs"
                        >
                          documents
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" className="flex-wrap text-xs" />}
            />
          </PieChart>
        </ChartContainer>
      )}
    </ChartCard>
  )
}

// ─── Expiry Timeline Chart ────────────────────────────────────────────────────

const timelineConfig: ChartConfig = {
  total: { label: "Expiring", color: "var(--chart-2)" },
  critical: { label: "Critical", color: "var(--chart-1)" },
}

function ExpiryTimelineChart({
  items,
  isLoading,
}: {
  items: ExpiryTimelineItem[]
  isLoading?: boolean
}) {
  const hasData = items.some((i) => i.total > 0)

  return (
    <ChartCard
      title="Expiry timeline"
      description="Documents expiring over the next 6 months."
      isLoading={isLoading}
    >
      {!hasData ? (
        <p className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
          No upcoming expiries in the next 6 months.
        </p>
      ) : (
        <ChartContainer
          config={timelineConfig}
          className="aspect-auto h-[min(260px,44vh)] w-full"
          initialDimension={{ width: 400, height: 240 }}
        >
          <BarChart
            data={items}
            margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={32}>
              <LabelList
                dataKey="total"
                position="top"
                offset={6}
                className="fill-foreground"
                fontSize={11}
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>
            <Bar dataKey="critical" fill="var(--color-critical)" radius={[4, 4, 0, 0]} maxBarSize={32}>
              <LabelList
                dataKey="critical"
                position="top"
                offset={6}
                className="fill-foreground"
                fontSize={11}
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  )
}

// ─── Mandatory vs Optional Pie ────────────────────────────────────────────────

function MandatoryPieChart({
  items,
  isLoading,
}: {
  items: DocumentExpiryBarItem[]
  isLoading?: boolean
}) {
  const mandatoryConfig: ChartConfig = {
    mandatory: { label: "Mandatory", color: "var(--chart-5)" },
    optional: { label: "Optional", color: "var(--chart-3)" },
    value: { label: "Documents" },
  }

  const rows = useMemo(() => toChartRows(items), [items])
  const pieData = useMemo(
    () =>
      toChartData(rows).map((row) => ({
        ...row,
        fill: `var(--color-${row.chartKey})`,
      })),
    [rows]
  )
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <ChartCard
      title="Mandatory vs optional"
      description="Compliance-required vs informational records."
      isLoading={isLoading}
    >
      {!items.length || total === 0 ? (
        <p className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
          No documents to classify.
        </p>
      ) : (
        <ChartContainer
          config={mandatoryConfig}
          className="aspect-square h-[min(260px,44vh)] w-full"
          initialDimension={{ width: 300, height: 260 }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="74%"
              paddingAngle={3}
              dataKey="value"
              nameKey="label"
            >
              {pieData.map((entry) => (
                <Cell key={entry.chartKey} fill={entry.fill} strokeWidth={0} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const mandatory = items.find((i) => i.chartKey === "mandatory")?.value ?? 0
                    const pct = total > 0 ? Math.round((mandatory / total) * 100) : 0
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {pct}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          required
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="label" className="text-xs" />}
            />
          </PieChart>
        </ChartContainer>
      )}
    </ChartCard>
  )
}

// ─── Generic horizontal bar chart card ───────────────────────────────────────

function HorizontalBarChartCard({
  title,
  description,
  items,
  isLoading,
  emptyMessage = "No data yet.",
}: {
  title: string
  description?: string
  items: DocumentExpiryBarItem[]
  isLoading?: boolean
  emptyMessage?: string
}) {
  const rows = useMemo(() => toChartRows(items), [items])
  const chartData = useMemo(() => toChartData(rows), [rows])
  const chartConfig = useMemo(() => buildChartConfigFromRows(rows), [rows])
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <ChartCard title={title} description={description} isLoading={isLoading}>
      {!items.length || total === 0 ? (
        <p className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
          {emptyMessage}
        </p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[min(260px,44vh)] w-full"
          initialDimension={{ width: 320, height: 240 }}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 4, right: 32, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} vertical strokeDasharray="3 3" />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={76}
              tick={{ fontSize: 11 }}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.35 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(_value, _name, item) => (
                    <span className="font-medium">
                      {(item.payload as { fullLabel?: string })?.fullLabel ??
                        item.payload?.label}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={6} maxBarSize={28}>
              {chartData.map((entry) => (
                <Cell key={entry.chartKey} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  )
}

// ─── DashboardCharts export ───────────────────────────────────────────────────

export function DashboardCharts({
  statusBars,
  categoryBars,
  typeBars,
  mandatoryBars,
  timelineItems,
  isLoading,
}: {
  statusBars: DocumentExpiryBarItem[]
  categoryBars: DocumentExpiryBarItem[]
  typeBars: DocumentExpiryBarItem[]
  mandatoryBars: DocumentExpiryBarItem[]
  timelineItems: ExpiryTimelineItem[]
  isLoading?: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Row 1: Status donut + Expiry timeline + Mandatory pie */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DonutStatusChart items={statusBars} isLoading={isLoading} />
        <ExpiryTimelineChart items={timelineItems} isLoading={isLoading} />
        <MandatoryPieChart items={mandatoryBars} isLoading={isLoading} />
      </div>

      {/* Row 2: Category + Type */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HorizontalBarChartCard
          title="By category"
          description="Employee, company, transport, and more."
          items={categoryBars}
          isLoading={isLoading}
          emptyMessage="No category data yet."
        />
        <HorizontalBarChartCard
          title="By document type"
          description="Passport, trade license, vehicle registration, and more."
          items={typeBars}
          isLoading={isLoading}
          emptyMessage="No type data yet."
        />
      </div>
    </div>
  )
}
