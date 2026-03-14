"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { endOfMonth, format, startOfMonth } from "date-fns"
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Download,
  MinusCircle,
  PlusCircle,
  Scale,
  Settings,
  TrendingUp,
  Wallet,
  XCircle,
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
  totalCashBalance: 1250000,
  totalBankBalance: 3850000,
  totalPayments: 485000,
  totalReceipts: 720000,
  pendingReconciliations: 3,
  unreconciledTransactions: 28,
  pendingTransfers: 2,
  pettyCashBalance: 15000,
}

const mockBankAccounts = [
  {
    name: "Main Operating Account",
    balance: 2500000,
    currency: "AED",
    reconciled: true,
  },
  {
    name: "Savings Account",
    balance: 850000,
    currency: "AED",
    reconciled: true,
  },
  { name: "USD Account", balance: 500000, currency: "USD", reconciled: false },
]

const mockRecentTransactions = [
  {
    type: "Receipt",
    documentNo: "GR-2024-045",
    description: "Customer Payment",
    amount: 125000,
    date: "2024-02-05",
    status: "Posted",
    bankAccount: "Main Operating Account",
  },
  {
    type: "Payment",
    documentNo: "GP-2024-044",
    description: "Supplier Payment",
    amount: -68000,
    date: "2024-02-04",
    status: "Posted",
    bankAccount: "Main Operating Account",
  },
  {
    type: "Bank Transfer",
    documentNo: "BT-2024-012",
    description: "Transfer to Savings",
    amount: 200000,
    date: "2024-02-03",
    status: "Pending",
    bankAccount: "Main Operating Account",
  },
]

const mockPendingReconciliations = [
  {
    bankAccount: "USD Account",
    lastReconciled: "2024-01-15",
    unreconciledCount: 15,
    statementBalance: 485000,
    bookBalance: 500000,
    difference: 15000,
  },
  {
    bankAccount: "Main Operating Account",
    lastReconciled: "2024-01-31",
    unreconciledCount: 8,
    statementBalance: 2520000,
    bookBalance: 2500000,
    difference: -20000,
  },
  {
    bankAccount: "Savings Account",
    lastReconciled: "2024-01-28",
    unreconciledCount: 5,
    statementBalance: 855000,
    bookBalance: 850000,
    difference: -5000,
  },
]

const mockPendingApprovals = [
  {
    type: "Payment",
    documentNo: "GP-2024-146",
    description: "Large Supplier Payment",
    amount: 250000,
    submittedBy: "John Doe",
    submittedDate: "2024-02-05",
  },
  {
    type: "Bank Transfer",
    documentNo: "BT-2024-013",
    description: "Inter-bank Transfer",
    amount: 100000,
    submittedBy: "Jane Smith",
    submittedDate: "2024-02-04",
  },
]

export default function CBDashboardPage() {
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

  const netCashFlow = mockKPIData.totalReceipts - mockKPIData.totalPayments

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cash Book Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of cash, bank balances, and transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full min-w-[280px] sm:w-auto"
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
      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cash Balance
            </CardTitle>
            <Wallet className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockKPIData.totalCashBalance)}
            </div>
            <p className="text-muted-foreground text-xs">Cash on hand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bank Balance
            </CardTitle>
            <Banknote className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockKPIData.totalBankBalance)}
            </div>
            <p className="text-muted-foreground text-xs">All bank accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receipts
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600">
              <PlusCircle className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mockKPIData.totalReceipts)}
            </div>
            <p className="text-muted-foreground text-xs">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600">
              <MinusCircle className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockKPIData.totalPayments)}
            </div>
            <p className="text-muted-foreground text-xs">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netCashFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(netCashFlow)}
            </div>
            <p className="text-muted-foreground text-xs">Receipts - Payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Recons
            </CardTitle>
            <Scale className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {mockKPIData.pendingReconciliations}
            </div>
            <p className="text-muted-foreground text-xs">Bank accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {mockKPIData.unreconciledTransactions}
            </div>
            <p className="text-muted-foreground text-xs">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Petty Cash</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(mockKPIData.pettyCashBalance)}
            </div>
            <p className="text-muted-foreground text-xs">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bank Accounts Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts Summary</CardTitle>
            <CardDescription>Current balances by account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBankAccounts.map((account) => (
                <div key={account.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{account.name}</span>
                      {account.reconciled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(account.balance)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {account.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant={account.reconciled ? "default" : "destructive"}
                    >
                      {account.reconciled ? "Reconciled" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
            <CardDescription>Receipts vs Payments this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-600">Receipts</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(mockKPIData.totalReceipts)}
                  </span>
                </div>
                <Progress
                  value={
                    (mockKPIData.totalReceipts /
                      (mockKPIData.totalReceipts + mockKPIData.totalPayments)) *
                    100
                  }
                  className="h-3"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-red-600">Payments</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(mockKPIData.totalPayments)}
                  </span>
                </div>
                <Progress
                  value={
                    (mockKPIData.totalPayments /
                      (mockKPIData.totalReceipts + mockKPIData.totalPayments)) *
                    100
                  }
                  className="h-3"
                />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Cash Flow</span>
                  <span
                    className={`text-lg font-bold ${
                      netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(netCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="reconciliations">
            Pending Reconciliations
          </TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions (Last 7 Days)</CardTitle>
                  <CardDescription>
                    Latest cash and bank transactions
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
                    <TableHead>Type</TableHead>
                    <TableHead>Document No</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentTransactions.map((transaction) => (
                    <TableRow key={transaction.documentNo}>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "Receipt"
                              ? "default"
                              : transaction.type === "Payment"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.documentNo}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.bankAccount}</TableCell>
                      <TableCell
                        className={
                          transaction.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "Posted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
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

        <TabsContent value="reconciliations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Bank Reconciliations</CardTitle>
                  <CardDescription>
                    Bank accounts requiring reconciliation
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="px-3 py-1 text-lg">
                  {mockPendingReconciliations.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Last Reconciled</TableHead>
                    <TableHead>Unreconciled</TableHead>
                    <TableHead>Statement Balance</TableHead>
                    <TableHead>Book Balance</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPendingReconciliations.map((recon) => (
                    <TableRow key={recon.bankAccount}>
                      <TableCell className="font-medium">
                        {recon.bankAccount}
                      </TableCell>
                      <TableCell>{formatDate(recon.lastReconciled)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {recon.unreconciledCount} items
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(recon.statementBalance)}
                      </TableCell>
                      <TableCell>{formatCurrency(recon.bookBalance)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            Math.abs(recon.difference) < 0.01
                              ? "default"
                              : "destructive"
                          }
                        >
                          {formatCurrency(recon.difference)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${companyId}/cb/cbbankrecon?bankAccount=${recon.bankAccount}`
                            )
                          }
                        >
                          Reconcile
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
                    <TableHead>Description</TableHead>
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
                      <TableCell>{approval.description}</TableCell>
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
