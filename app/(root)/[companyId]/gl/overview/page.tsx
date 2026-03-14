"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { endOfMonth, format, startOfMonth } from "date-fns"
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Settings,
  TrendingDown,
  TrendingUp,
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
  totalJournalEntries: 1245,
  postedEntries: 1180,
  pendingEntries: 65,
  totalDebits: 12500000,
  totalCredits: 12500000,
  unbalancedEntries: 3,
  pendingApprovals: 12,
  currentPeriod: "2024-02",
  periodStatus: "Open",
}

const mockAccountBalances = [
  { account: "Cash & Bank", balance: 2500000, type: "Debit", percentage: 20.0 },
  {
    account: "Accounts Receivable",
    balance: 1800000,
    type: "Debit",
    percentage: 14.4,
  },
  { account: "Inventory", balance: 3200000, type: "Debit", percentage: 25.6 },
  {
    account: "Accounts Payable",
    balance: 1500000,
    type: "Credit",
    percentage: 12.0,
  },
  { account: "Revenue", balance: 3500000, type: "Credit", percentage: 28.0 },
]

const mockTopAccounts = [
  {
    code: "1001",
    name: "Cash - Main Account",
    balance: 2500000,
    type: "Debit",
  },
  {
    code: "2001",
    name: "Accounts Receivable",
    balance: 1800000,
    type: "Debit",
  },
  {
    code: "3001",
    name: "Inventory - Raw Materials",
    balance: 1200000,
    type: "Debit",
  },
  { code: "4001", name: "Sales Revenue", balance: 3500000, type: "Credit" },
  { code: "5001", name: "Accounts Payable", balance: 1500000, type: "Credit" },
]

const mockUnbalancedEntries = [
  {
    journalNo: "JE-2024-001",
    date: "2024-02-05",
    debit: 125000,
    credit: 120000,
    difference: 5000,
    status: "Unbalanced",
  },
  {
    journalNo: "JE-2024-002",
    date: "2024-02-04",
    debit: 85000,
    credit: 90000,
    difference: -5000,
    status: "Unbalanced",
  },
  {
    journalNo: "JE-2024-003",
    date: "2024-02-03",
    debit: 150000,
    credit: 145000,
    difference: 5000,
    status: "Unbalanced",
  },
]

const mockRecentJournals = [
  {
    journalNo: "JE-2024-125",
    date: "2024-02-05",
    referenceNo: "REF-001",
    totalAmount: 45000,
    status: "Posted",
    createdBy: "John Doe",
  },
  {
    journalNo: "JE-2024-124",
    date: "2024-02-04",
    referenceNo: "REF-002",
    totalAmount: 68000,
    status: "Posted",
    createdBy: "Jane Smith",
  },
  {
    journalNo: "JE-2024-123",
    date: "2024-02-03",
    referenceNo: "REF-003",
    totalAmount: 92000,
    status: "Pending",
    createdBy: "Mike Johnson",
  },
]

const mockPendingApprovals = [
  {
    type: "Journal Entry",
    documentNo: "JE-2024-126",
    referenceNo: "REF-004",
    amount: 125000,
    submittedBy: "John Doe",
    submittedDate: "2024-02-05",
  },
  {
    type: "AR/AP Contra",
    documentNo: "CT-2024-012",
    referenceNo: "REF-005",
    amount: 85000,
    submittedBy: "Jane Smith",
    submittedDate: "2024-02-04",
  },
]

export default function GLDashboardPage() {
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
            GL Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of general ledger and financial transactions
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
              Total Journal Entries
            </CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockKPIData.totalJournalEntries}
            </div>
            <p className="text-muted-foreground text-xs">All entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posted Entries
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockKPIData.postedEntries}
            </div>
            <p className="text-muted-foreground text-xs">
              {Math.round(
                (mockKPIData.postedEntries / mockKPIData.totalJournalEntries) *
                  100
              )}
              % posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Entries
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {mockKPIData.pendingEntries}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(mockKPIData.totalDebits)}
            </div>
            <p className="text-muted-foreground text-xs">Debit balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(mockKPIData.totalCredits)}
            </div>
            <p className="text-muted-foreground text-xs">Credit balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unbalanced</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockKPIData.unbalancedEntries}
            </div>
            <p className="text-muted-foreground text-xs">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Period
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{mockKPIData.currentPeriod}</div>
            <p className="text-muted-foreground truncate text-xs">
              {mockKPIData.periodStatus}
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
        {/* Account Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Account Balance Summary</CardTitle>
            <CardDescription>
              Distribution of account balances by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAccountBalances.map((item) => (
                <div key={item.account} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.account}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.balance)} ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.type === "Debit" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Accounts by Balance</CardTitle>
            <CardDescription>Highest account balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopAccounts.map((account, index) => (
                <div
                  key={account.code}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {account.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(account.balance)}
                    </p>
                    <Badge
                      variant={
                        account.type === "Debit" ? "default" : "secondary"
                      }
                      className="mt-1"
                    >
                      {account.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <Tabs defaultValue="unbalanced" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unbalanced">Unbalanced Entries</TabsTrigger>
          <TabsTrigger value="recent">Recent Journals</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="unbalanced" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unbalanced Journal Entries</CardTitle>
                  <CardDescription>
                    Journal entries with debit/credit imbalance requiring
                    attention
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
                    <TableHead>Journal No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUnbalancedEntries.map((entry) => (
                    <TableRow key={entry.journalNo}>
                      <TableCell className="font-medium">
                        {entry.journalNo}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{formatCurrency(entry.debit)}</TableCell>
                      <TableCell>{formatCurrency(entry.credit)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.difference > 0 ? "destructive" : "secondary"
                          }
                        >
                          {formatCurrency(Math.abs(entry.difference))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{entry.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${companyId}/gl/journalentry?docId=${entry.journalNo}`
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
                  <CardTitle>Recent Journal Entries (Last 7 Days)</CardTitle>
                  <CardDescription>
                    Recently created journal entries
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
                    <TableHead>Journal No</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentJournals.map((journal) => (
                    <TableRow key={journal.journalNo}>
                      <TableCell className="font-medium">
                        {journal.journalNo}
                      </TableCell>
                      <TableCell>{journal.referenceNo}</TableCell>
                      <TableCell>{formatDate(journal.date)}</TableCell>
                      <TableCell>
                        {formatCurrency(journal.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            journal.status === "Posted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {journal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{journal.createdBy}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${companyId}/gl/journalentry?docId=${journal.journalNo}`
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
                    <TableHead>Reference No</TableHead>
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
                      <TableCell>{approval.referenceNo}</TableCell>
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
