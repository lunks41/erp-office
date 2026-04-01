"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { endOfMonth, format, startOfMonth } from "date-fns"
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Settings,
  TrendingDown,
} from "lucide-react"
import { DateRange } from "react-day-picker"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data - Replace with actual API calls
const mockKPIData = {
  totalAPOutstanding: 1850000,
  overdueAP: 425000,
  overdue30Days: 165000,
  overdue60Days: 140000,
  overdue90Days: 120000,
  dpo: 38,
  topSupplierOutstanding: 285000,
  percentPastDue: 23.0,
  pendingApprovals: 8,
}

const mockAgingData = [
  { bucket: "Current", amount: 1425000, percentage: 77.0 },
  { bucket: "1-30 Days", amount: 165000, percentage: 8.9 },
  { bucket: "31-60 Days", amount: 140000, percentage: 7.6 },
  { bucket: "61-90 Days", amount: 80000, percentage: 4.3 },
  { bucket: "90+ Days", amount: 120000, percentage: 6.5 },
]

const mockTopSuppliers = [
  { name: "Global Supplies Inc", outstanding: 285000, daysOverdue: 12 },
  { name: "Tech Materials Co", outstanding: 245000, daysOverdue: 0 },
  { name: "Industrial Parts Ltd", outstanding: 198000, daysOverdue: 28 },
  { name: "Office Solutions LLC", outstanding: 175000, daysOverdue: 0 },
  { name: "Manufacturing Supplies", outstanding: 152000, daysOverdue: 42 },
]

const mockOverdueInvoices = [
  {
    invoiceNo: "INV-2024-101",
    supplier: "Global Supplies Inc",
    amount: 125000,
    dueDate: "2024-01-15",
    daysOverdue: 25,
    status: "Overdue",
  },
  {
    invoiceNo: "INV-2024-102",
    supplier: "Industrial Parts Ltd",
    amount: 98000,
    dueDate: "2024-01-20",
    daysOverdue: 20,
    status: "Overdue",
  },
  {
    invoiceNo: "INV-2024-103",
    supplier: "Manufacturing Supplies",
    amount: 75000,
    dueDate: "2024-01-10",
    daysOverdue: 30,
    status: "Overdue",
  },
]

const mockRecentInvoices = [
  {
    invoiceNo: "INV-2024-145",
    supplier: "Office Solutions LLC",
    amount: 45000,
    date: "2024-02-05",
    status: "Posted",
  },
  {
    invoiceNo: "INV-2024-144",
    supplier: "Tech Materials Co",
    amount: 68000,
    date: "2024-02-04",
    status: "Posted",
  },
  {
    invoiceNo: "INV-2024-143",
    supplier: "Global Supplies Inc",
    amount: 92000,
    date: "2024-02-03",
    status: "Pending",
  },
]

const mockPendingApprovals = [
  {
    type: "Invoice",
    documentNo: "INV-2024-146",
    supplier: "New Supplier Co.",
    amount: 125000,
    submittedBy: "John Doe",
    submittedDate: "2024-02-05",
  },
  {
    type: "Adjustment",
    documentNo: "ADJ-2024-012",
    supplier: "Global Supplies Inc",
    amount: -15000,
    submittedBy: "Jane Smith",
    submittedDate: "2024-02-04",
  },
]

export default function APDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const { decimals } = useAuthStore()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [selectedCurrency, setSelectedCurrency] = useState("AED")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState("15")

  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || "dd/MM/yyyy",
    [decimals]
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), dateFormat)
    } catch {
      return dateString
    }
  }

  return (
    <div className="@container flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] min-h-0 flex-col gap-0 overflow-hidden px-2 pb-2 pt-1">
      <div className="mx-auto min-h-0 w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AP Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of accounts payable and vendor management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="dubai">Dubai</SelectItem>
              <SelectItem value="abu-dhabi">Abu Dhabi</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total AP Outstanding
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockKPIData.totalAPOutstanding)}
            </div>
            <p className="text-muted-foreground text-xs">All payables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue AP</CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {formatCurrency(mockKPIData.overdueAP)}
            </div>
            <p className="text-muted-foreground text-xs">
              {mockKPIData.percentPastDue}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DPO</CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIData.dpo}</div>
            <p className="text-muted-foreground text-xs">Days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30 Days</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(mockKPIData.overdue30Days)}
            </div>
            <p className="text-muted-foreground text-xs">Overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">60 Days</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(mockKPIData.overdue60Days)}
            </div>
            <p className="text-muted-foreground text-xs">Overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockKPIData.overdue90Days)}
            </div>
            <p className="text-muted-foreground text-xs">Overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Supplier</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockKPIData.topSupplierOutstanding)}
            </div>
            <p className="text-muted-foreground truncate text-xs">
              Global Supplies Inc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockKPIData.pendingApprovals}
            </div>
            <p className="text-muted-foreground text-xs">Approvals</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Aging Summary Chart */}
        <Card>
          <CardHeader>
            <CardTitle>AP Aging Summary</CardTitle>
            <CardDescription>Distribution of payables by age</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAgingData.map((item) => (
                <div key={item.bucket} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.bucket}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Suppliers by Outstanding</CardTitle>
            <CardDescription>Highest payable balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopSuppliers.map((supplier, index) => (
                <div
                  key={supplier.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {supplier.daysOverdue > 0
                          ? `${supplier.daysOverdue} days overdue`
                          : "Current"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(supplier.outstanding)}
                    </p>
                    {supplier.daysOverdue > 0 && (
                      <Badge variant="destructive" className="mt-1">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overdue">Overdue Invoices</TabsTrigger>
          <TabsTrigger value="recent">Recent Invoices</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Overdue Invoices</CardTitle>
                  <CardDescription>
                    Invoices past their due date requiring payment
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOverdueInvoices.map((invoice) => (
                    <TableRow key={invoice.invoiceNo}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNo}
                      </TableCell>
                      <TableCell>{invoice.supplier}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {invoice.daysOverdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${companyId}/ap/invoice?docId=${invoice.invoiceNo}`
                            )
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Invoices (Last 7 Days)</CardTitle>
                  <CardDescription>Recently received invoices</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentInvoices.map((invoice) => (
                    <TableRow key={invoice.invoiceNo}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNo}
                      </TableCell>
                      <TableCell>{invoice.supplier}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "Posted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${companyId}/ap/invoice?docId=${invoice.invoiceNo}`
                            )
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Documents awaiting approval</CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1 text-lg">
                  {mockPendingApprovals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Document No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPendingApprovals.map((approval) => (
                    <TableRow key={approval.documentNo}>
                      <TableCell>
                        <Badge variant="outline">{approval.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {approval.documentNo}
                      </TableCell>
                      <TableCell>{approval.supplier}</TableCell>
                      <TableCell>{formatCurrency(approval.amount)}</TableCell>
                      <TableCell>{approval.submittedBy}</TableCell>
                      <TableCell>
                        {formatDate(approval.submittedDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="default" size="sm">
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auto-refresh Settings */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="auto-refresh">Auto-refresh</Label>
          <p className="text-muted-foreground text-sm">
            Automatically refresh dashboard data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={refreshInterval}
            onValueChange={setRefreshInterval}
            disabled={!autoRefresh}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 min</SelectItem>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
            </SelectContent>
          </Select>
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
