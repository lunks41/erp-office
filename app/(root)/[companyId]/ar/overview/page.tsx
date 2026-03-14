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
  TrendingUp,
  Users,
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
  totalAROutstanding: 2450000,
  overdueAR: 485000,
  overdue30Days: 180000,
  overdue60Days: 150000,
  overdue90Days: 155000,
  dso: 42,
  topCustomerOutstanding: 320000,
  percentPastDue: 19.8,
  pendingApprovals: 12,
}

const mockAgingData = [
  { bucket: "Current", amount: 1965000, percentage: 80.2 },
  { bucket: "1-30 Days", amount: 180000, percentage: 7.3 },
  { bucket: "31-60 Days", amount: 150000, percentage: 6.1 },
  { bucket: "61-90 Days", amount: 100000, percentage: 4.1 },
  { bucket: "90+ Days", amount: 155000, percentage: 6.3 },
]

const mockTopCustomers = [
  { name: "ABC Corporation", outstanding: 320000, daysOverdue: 15 },
  { name: "XYZ Industries", outstanding: 285000, daysOverdue: 0 },
  { name: "Global Trading Co.", outstanding: 245000, daysOverdue: 32 },
  { name: "Tech Solutions Ltd", outstanding: 198000, daysOverdue: 0 },
  { name: "Manufacturing Inc", outstanding: 175000, daysOverdue: 45 },
]

const mockOverdueInvoices = [
  {
    invoiceNo: "INV-2024-001",
    customer: "ABC Corporation",
    amount: 125000,
    dueDate: "2024-01-15",
    daysOverdue: 25,
    status: "Overdue",
  },
  {
    invoiceNo: "INV-2024-002",
    customer: "Global Trading Co.",
    amount: 98000,
    dueDate: "2024-01-20",
    daysOverdue: 20,
    status: "Overdue",
  },
  {
    invoiceNo: "INV-2024-003",
    customer: "Manufacturing Inc",
    amount: 75000,
    dueDate: "2024-01-10",
    daysOverdue: 30,
    status: "Overdue",
  },
]

const mockRecentInvoices = [
  {
    invoiceNo: "INV-2024-045",
    customer: "Tech Solutions Ltd",
    amount: 45000,
    date: "2024-02-05",
    status: "Posted",
  },
  {
    invoiceNo: "INV-2024-044",
    customer: "XYZ Industries",
    amount: 68000,
    date: "2024-02-04",
    status: "Posted",
  },
  {
    invoiceNo: "INV-2024-043",
    customer: "ABC Corporation",
    amount: 92000,
    date: "2024-02-03",
    status: "Pending",
  },
]

const mockPendingApprovals = [
  {
    type: "Invoice",
    documentNo: "INV-2024-046",
    customer: "New Customer Co.",
    amount: 125000,
    submittedBy: "John Doe",
    submittedDate: "2024-02-05",
  },
  {
    type: "Adjustment",
    documentNo: "ADJ-2024-012",
    customer: "ABC Corporation",
    amount: -15000,
    submittedBy: "Jane Smith",
    submittedDate: "2024-02-04",
  },
]

export default function ARDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const { decimals, currentCompany: _currentCompany } = useAuthStore()

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
    // Format number with commas and 2 decimal places
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
    // Add currency code as prefix
    return `${selectedCurrency} ${formatted}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), dateFormat)
    } catch {
      return dateString
    }
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            AR Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of accounts receivable and collections
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
              Total AR Outstanding
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockKPIData.totalAROutstanding)}
            </div>
            <p className="text-muted-foreground text-xs">All receivables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue AR</CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {formatCurrency(mockKPIData.overdueAR)}
            </div>
            <p className="text-muted-foreground text-xs">
              {mockKPIData.percentPastDue}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DSO</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockKPIData.dso}</div>
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
            <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(mockKPIData.topCustomerOutstanding)}
            </div>
            <p className="text-muted-foreground truncate text-xs">
              ABC Corporation
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
            <CardTitle>AR Aging Summary</CardTitle>
            <CardDescription>
              Distribution of receivables by age
            </CardDescription>
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

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customers by Outstanding</CardTitle>
            <CardDescription>Highest receivable balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopCustomers.map((customer, index) => (
                <div
                  key={customer.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {customer.daysOverdue > 0
                          ? `${customer.daysOverdue} days overdue`
                          : "Current"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(customer.outstanding)}
                    </p>
                    {customer.daysOverdue > 0 && (
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
                    Invoices past their due date requiring attention
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
                    <TableHead>Customer</TableHead>
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
                      <TableCell>{invoice.customer}</TableCell>
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
                              `/${companyId}/ar/invoice?docId=${invoice.invoiceNo}`
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
                  <CardDescription>Recently created invoices</CardDescription>
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
                    <TableHead>Customer</TableHead>
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
                      <TableCell>{invoice.customer}</TableCell>
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
                              `/${companyId}/ar/invoice?docId=${invoice.invoiceNo}`
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
                    <TableHead>Customer</TableHead>
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
                      <TableCell>{approval.customer}</TableCell>
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
  )
}
