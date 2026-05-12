"use client"

import { useState } from "react"
import { ISalaryComponent, ISalaryHistory } from "@/interfaces/payroll"
import {
  Calendar,
  DollarSign,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import { SalaryComponentsForm } from "../forms/employee-salary-components"

export function EmployeeSalaryDetailsTable({
  employeeSalaryDetails,
  salaryHistory,
}: {
  employeeSalaryDetails: ISalaryComponent[]
  salaryHistory: ISalaryHistory[]
}) {
  const [editSalaryDialogOpen, setEditSalaryDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("main")
  const [showAmounts, setShowAmounts] = useState(false)

  const handleEditSalary = () => {
    setEditSalaryDialogOpen(true)
  }

  const handleCancelEdit = () => {
    setEditSalaryDialogOpen(false)
  }

  const toggleAmountVisibility = () => {
    setShowAmounts(!showAmounts)
  }

  // Helper function to format amount with visibility toggle
  const formatAmount = (amount: number, size: "sm" | "md" | "lg" = "sm") => {
    if (showAmounts) {
      return <CurrencyFormatter amount={amount} size={size} />
    }
    return <span className="font-mono text-xs">*****</span>
  }

  // Calculate totals from the array data
  const totalMonthly =
    employeeSalaryDetails?.reduce(
      (sum, component) => sum + (component.amount || 0),
      0
    ) || 0
  const totalAnnual = totalMonthly * 12

  // Group components by type (Earning/Deduction)
  const earnings = employeeSalaryDetails?.filter(
    (component) => component.componentType === "Earning"
  )
  const deductions = employeeSalaryDetails?.filter(
    (component) => component.componentType === "Deduction"
  )

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAmountVisibility}
            className="h-8 px-2"
          >
            {showAmounts ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>

        <TabsContent value="main" className="space-y-4">
          {/* Salary Summary */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                </div>
                <h3 className="text-sm font-medium">Annual Income</h3>
              </div>
              <p className="text-xl font-bold">{formatAmount(totalAnnual)}</p>
              <p className="text-muted-foreground text-xs">per year</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">Monthly Income</h3>
              </div>
              <p className="text-xl font-bold">{formatAmount(totalMonthly)}</p>
              <p className="text-muted-foreground text-xs">per month</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100">
                    <DollarSign className="h-3 w-3 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-medium">Actions</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditSalary}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Revise
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Update salary components
              </p>
            </div>
          </div>

          {/* Salary Components - Earnings */}
          <div className="bg-background rounded-lg border">
            <div className="border-b p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">
                      Salary Components
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Breakdown of earnings and allowances
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {earnings?.length || 0} Components
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4 py-2 text-xs font-medium">
                      COMPONENT
                    </TableHead>
                    <TableHead className="w-1/4 py-2 text-xs font-medium">
                      TYPE
                    </TableHead>
                    <TableHead className="w-1/4 py-2 text-xs font-medium">
                      MONTHLY
                    </TableHead>
                    <TableHead className="w-1/4 py-2 text-xs font-medium">
                      ANNUAL
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings?.map((component) => (
                    <TableRow key={component.componentId}>
                      <TableCell className="py-1 text-xs font-medium">
                        {component.componentName}
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge variant="outline" className="text-xs">
                          {component.componentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 text-right text-xs font-medium">
                        {formatAmount(component.amount || 0)}
                      </TableCell>
                      <TableCell className="py-1 text-right text-xs font-medium">
                        {formatAmount((component.amount || 0) * 12)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={2} className="py-1 text-sm font-bold">
                      Total Gross Pay
                    </TableCell>
                    <TableCell className="py-1 text-right text-sm font-bold">
                      {formatAmount(totalMonthly)}
                    </TableCell>
                    <TableCell className="py-1 text-right text-sm font-bold">
                      {formatAmount(totalAnnual)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Other Deductions */}
          {deductions && deductions.length > 0 && (
            <div className="bg-background rounded-lg border">
              <div className="border-b p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <Edit3 className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Deductions</h3>
                      <p className="text-muted-foreground text-xs">
                        Salary deductions and withholdings
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {deductions?.length || 0} Deductions
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4 py-2 text-xs font-medium">
                        DEDUCTION
                      </TableHead>
                      <TableHead className="w-1/4 py-2 text-xs font-medium">
                        TYPE
                      </TableHead>
                      <TableHead className="w-1/4 py-2 text-xs font-medium">
                        MONTHLY
                      </TableHead>
                      <TableHead className="w-1/4 py-2 text-xs font-medium">
                        ANNUAL
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions?.map((component) => (
                      <TableRow key={component.componentId}>
                        <TableCell className="py-1 text-xs font-medium">
                          {component.componentName}
                        </TableCell>
                        <TableCell className="py-1">
                          <Badge variant="outline" className="text-xs">
                            {component.componentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount(component.amount || 0)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount((component.amount || 0) * 12)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Salary History */}
          <div className="bg-background rounded-lg border">
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Salary History</h3>
                  <p className="text-muted-foreground text-xs">
                    Historical salary changes and revisions
                  </p>
                </div>
              </div>
            </div>

            {!salaryHistory || salaryHistory.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-muted-foreground text-sm">
                  No salary history found
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] py-2 text-xs font-medium">
                        EFFECT DATE
                      </TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-medium">
                        BASIC
                      </TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-medium">
                        HOUSE ALLOWANCE
                      </TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-medium">
                        FOOD ALLOWANCE
                      </TableHead>
                      <TableHead className="w-[120px] py-2 text-xs font-medium">
                        OTHER ALLOWANCE
                      </TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-medium">
                        TOTAL
                      </TableHead>
                      <TableHead className="w-[100px] py-2 text-xs font-medium">
                        INCREMENT
                      </TableHead>
                      <TableHead className="w-[80px] py-2 text-xs font-medium">
                        %
                      </TableHead>
                      <TableHead className="w-[80px] py-2 text-xs font-medium">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryHistory?.map((record: ISalaryHistory) => (
                      <TableRow key={record.revisionId}>
                        <TableCell className="py-1 text-xs font-medium">
                          {new Date(record.effectDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount(record.basicAllowance)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount(record.houseAllowance)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount(record.foodAllowance)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          {formatAmount(record.otherAllowance)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-bold">
                          {formatAmount(record.total)}
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {record.incrementAmount !== 0 && (
                              <span
                                className={
                                  record.incrementAmount > 0
                                    ? "text-green-600"
                                    : record.incrementAmount < 0
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                }
                              >
                                {record.incrementAmount > 0 ? "↗" : "↘"}
                              </span>
                            )}
                            <span
                              className={
                                record.incrementAmount > 0
                                  ? "text-green-600"
                                  : record.incrementAmount < 0
                                    ? "text-red-600"
                                    : "text-yellow-600"
                              }
                            >
                              {formatAmount(record.incrementAmount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 text-right text-xs font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {record.incrementPercentage !== 0 && (
                              <span
                                className={
                                  record.incrementPercentage > 0
                                    ? "text-green-600"
                                    : record.incrementPercentage < 0
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                }
                              >
                                {record.incrementPercentage > 0 ? "↗" : "↘"}
                              </span>
                            )}
                            <span
                              className={
                                record.incrementPercentage > 0
                                  ? "text-green-600"
                                  : record.incrementPercentage < 0
                                    ? "text-red-600"
                                    : "text-yellow-600"
                              }
                            >
                              {record.incrementPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-1 text-right text-xs font-medium">
                          {record.createdBy} |{" "}
                          {new Date(record.createdDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Salary Components Dialog */}
      <Dialog
        open={editSalaryDialogOpen}
        onOpenChange={setEditSalaryDialogOpen}
      >
        <DialogContent
          className="max-h-[90vh] w-[95vw] !max-w-none overflow-y-auto sm:w-[80vw]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">
              Edit Salary Components
            </DialogTitle>
          </DialogHeader>
          <SalaryComponentsForm
            employeeSalaryDetails={employeeSalaryDetails}
            onCancelAction={handleCancelEdit}
            onSaveSuccess={() => setEditSalaryDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
