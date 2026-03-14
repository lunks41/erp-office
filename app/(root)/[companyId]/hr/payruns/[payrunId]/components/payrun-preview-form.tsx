"use client"

import { useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IPayrollEmployeeDt,
  IPayrollEmployeeHd,
  ISavePayrunComponentViewModel,
} from "@/interfaces/payrun"
import { savePayrunComponentSchema } from "@/schemas/payrun"
import { toast } from "sonner"

import { useGetById, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

interface PayRunPreviewFormProps {
  employee: IPayrollEmployeeHd | null
  onCloseAction: () => void
  onRefetch: () => void
  payrunId: string
}

export function PayRunPreviewForm({
  employee,
  onCloseAction,
  onRefetch,
  payrunId,
}: PayRunPreviewFormProps) {
  console.log(
    "🔄 PayRunPreviewForm: Component rendered with employee:",
    employee,
    "payrunId:",
    payrunId
  )

  const [isEditingPayableDays, setIsEditingPayableDays] = useState(false)
  const [editablePayableDays, setEditablePayableDays] = useState(0)
  const [isEditingPastDays, setIsEditingPastDays] = useState(false)
  const [editablePastDays, setEditablePastDays] = useState(0)
  const [editingDeductionId, setEditingDeductionId] = useState<number | null>(
    null
  )
  const [editableDeductionAmounts, setEditableDeductionAmounts] = useState<
    Record<number, number>
  >({})
  const [editingEarningId, setEditingEarningId] = useState<number | null>(null)
  const [editableEarningAmounts, setEditableEarningAmounts] = useState<
    Record<number, number>
  >({})
  const [updatedEmployeeData, setUpdatedEmployeeData] = useState<
    IPayrollEmployeeDt[]
  >([])
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  // Removed refreshKey since it's not needed anymore

  useEffect(() => {
    console.log("🔄 PayRunPreviewForm: useEffect triggered - employee changed")
    console.log("🔄 PayRunPreviewForm: New employee:", employee)
    console.log(
      "🔄 PayRunPreviewForm: Employee ID:",
      employee?.payrollEmployeeId
    )

    // Don't automatically force refresh - this was causing double API calls
    // Only refresh when explicitly needed (after save operations)

    // Don't automatically increment refreshKey on mount
    // Only increment when we actually need to refresh data (after save)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit employee to avoid refetch loops
  }, [employee?.payrollEmployeeId])

  console.log(
    "📡 PayRunPreviewForm: Calling useGetById hook for employee details"
  )
  // refreshKey is included in query key to force refresh after save operations
  // but not auto-incremented on mount to avoid double API calls

  // Check if we have the required data to make the API call
  const hasRequiredData = Boolean(employee?.payrollEmployeeId && payrunId)
  console.log(
    "🔍 PayRunPreviewForm: Has required data for API call:",
    hasRequiredData
  )
  console.log("🔍 PayRunPreviewForm: Employee ID:", employee?.payrollEmployeeId)
  console.log("🔍 PayRunPreviewForm: Payrun ID:", payrunId)

  const { data: employeeDetails, isLoading } = useGetById<IPayrollEmployeeDt[]>(
    `/hr/payrollruns/payrundetailslist/${payrunId}`,
    `employee-details-${employee?.payrollEmployeeId || "none"}`, // Removed refreshKey to prevent unnecessary API calls
    employee?.payrollEmployeeId?.toString() || ""
  )

  console.log(
    "📊 PayRunPreviewForm: Employee details received:",
    employeeDetails
  )
  console.log("⏳ PayRunPreviewForm: Loading state:", isLoading)

  const employeeData =
    (employeeDetails?.data as unknown as IPayrollEmployeeDt[]) || []

  // Use updated data if available, otherwise use original data
  const displayData =
    updatedEmployeeData.length > 0 ? updatedEmployeeData : employeeData

  // Calculate Net Pay based on current edited data
  const calculateNetPay = () => {
    const totalEarnings = displayData
      .filter((item) => item.componentType?.toLowerCase() === "earning")
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    const totalDeductions = displayData
      .filter((item) => item.componentType?.toLowerCase() === "deduction")
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    return totalEarnings - totalDeductions
  }

  const currentNetPay = calculateNetPay()

  // Calculate Basic Net Pay
  const calculateBasicNetPay = () => {
    const totalBasicEarnings = displayData
      .filter((item) => item.componentType?.toLowerCase() === "earning")
      .reduce((sum, item) => sum + (item.basicAmount || 0), 0)

    const totalBasicDeductions = displayData
      .filter((item) => item.componentType?.toLowerCase() === "deduction")
      .reduce((sum, item) => sum + (item.basicAmount || 0), 0)

    return totalBasicEarnings - totalBasicDeductions
  }

  const currentBasicNetPay = calculateBasicNetPay()

  // Helper function for number formatting without currency symbol
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  }

  // API call to save employee payroll data
  console.log(
    "📡 PayRunPreviewForm: Calling usePersist hook for saveEmployeePayroll"
  )
  const apiEndpoint = `/hr/payrollruns/components/${payrunId}/${employee?.payrollEmployeeId}`
  console.log("🌐 PayRunPreviewForm: API endpoint:", apiEndpoint)

  const { mutate: saveEmployeePayroll, isPending: isSaving } =
    usePersist(apiEndpoint)

  // Expose the refresh function to parent component
  useEffect(() => {
    if (employee?.payrollEmployeeId) {
      // You can call this function from parent component
      console.log(
        "🔄 PayRunPreviewForm: Exposing forceRefresh function for employee:",
        employee.payrollEmployeeId
      )
      // Example: Call forceRefresh when employee changes (this will trigger data refresh)
      // forceRefresh()
      // Alternative: Use React Query's refetch
      // forceRefetch()
    }
  }, [employee?.payrollEmployeeId])

  const handleSave = () => {
    console.log("💾 PayRunPreviewForm: handleSave called")
    console.log("📊 PayRunPreviewForm: Current display data:", displayData)
    console.log("👤 PayRunPreviewForm: Employee data:", employee)
    console.log(
      "🆔 PayRunPreviewForm: Employee ID:",
      employee?.payrollEmployeeId
    )
    console.log("🆔 PayRunPreviewForm: Payrun ID:", payrunId)

    // Check if required data exists
    if (!employee?.payrollEmployeeId) {
      console.log("❌ PayRunPreviewForm: Missing employee ID")
      toast.error("Employee ID is missing")
      return
    }

    if (!payrunId) {
      console.log("❌ PayRunPreviewForm: Missing payrun ID")
      toast.error("Payrun ID is missing")
      return
    }

    if (displayData.length === 0) {
      console.log("❌ PayRunPreviewForm: No display data to save")
      toast.error("No payroll data to save")
      return
    }

    // Create the save payload as a list of components from displayData
    const savePayload: ISavePayrunComponentViewModel[] = displayData.map(
      (item) => ({
        payrollEmployeeId: employee?.payrollEmployeeId || 0,
        payrollRunId: parseInt(payrunId),
        employeeId: employee?.employeeId || 0,
        componentId: item.componentId,
        amount: item.amount || 0,
        presentDays: editablePayableDays || employee?.presentDays || 0,
        pastDays: editablePastDays || employee?.pastDays || 0,
      })
    )

    console.log("📦 PayRunPreviewForm: Save payload created:", savePayload)

    // Validate the payload using the schema
    try {
      const validatedData = savePayrunComponentSchema.array().parse(savePayload)
      console.log(
        "✅ PayRunPreviewForm: Data validation successful:",
        validatedData
      )

      console.log("📡 PayRunPreviewForm: Calling saveEmployeePayroll API")
      console.log("📡 PayRunPreviewForm: API endpoint:", apiEndpoint)
      console.log("📡 PayRunPreviewForm: Data being sent:", validatedData)

      saveEmployeePayroll(validatedData, {
        onSuccess: (response: ApiResponse<unknown>) => {
          console.log(
            "✅ PayRunPreviewForm: saveEmployeePayroll API success:",
            response
          )
          if (response.result === 1) {
            toast.success("Employee payroll updated successfully")
            // No need to increment refreshKey since it's not in query key anymore
            // Just call onRefetch to refresh the parent table data
            onRefetch()
            onCloseAction()
          } else {
            console.log(
              "❌ PayRunPreviewForm: Save failed with result:",
              response.result
            )
            toast.error("Failed to update employee payroll")
          }
        },
        onError: (error: unknown) => {
          console.log(
            "❌ PayRunPreviewForm: saveEmployeePayroll API error:",
            error
          )
          toast.error("Failed to update employee payroll")
          console.error("Error updating employee payroll:", error)
        },
      })
    } catch (validationError) {
      console.log(
        "❌ PayRunPreviewForm: Data validation failed:",
        validationError
      )
      toast.error("Invalid data format")
      console.error("Validation error:", validationError)
    }
  }

  const handlePayableDaysSave = () => {
    setIsEditingPayableDays(false)
  }

  const handlePayableDaysCancel = () => {
    setEditablePayableDays(employee?.presentDays || 0)
    setIsEditingPayableDays(false)
  }

  const handlePastDaysSave = () => {
    setIsEditingPastDays(false)
  }

  const handlePastDaysCancel = () => {
    setEditablePastDays(employee?.pastDays || 0)
    setIsEditingPastDays(false)
  }

  const handleDeductionSave = (componentId: number) => {
    // Update the employeeData with the new amount, preserving existing updates
    const updatedData = (
      updatedEmployeeData.length > 0 ? updatedEmployeeData : employeeData
    ).map((item) =>
      item.componentId === componentId
        ? { ...item, amount: editableDeductionAmounts[componentId] || 0 }
        : item
    )
    setUpdatedEmployeeData(updatedData)
    setEditingDeductionId(null)
  }

  const handleDeductionCancel = () => {
    setEditingDeductionId(null)
  }

  const handleEarningSave = (componentId: number) => {
    // Update the employeeData with the new amount, preserving existing updates
    const updatedData = (
      updatedEmployeeData.length > 0 ? updatedEmployeeData : employeeData
    ).map((item) =>
      item.componentId === componentId
        ? { ...item, amount: editableEarningAmounts[componentId] || 0 }
        : item
    )
    setUpdatedEmployeeData(updatedData)
    setEditingEarningId(null)
  }

  const handleEarningCancel = () => {
    setEditingEarningId(null)
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading employee details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render form content if no employee is selected
  if (!employee) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground">No employee selected</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 pt-4">
        {/* Payable Days and Past Days Section */}
        <div>
          <div className="grid grid-cols-2 gap-4 border-b pb-2">
            {/* Payable Days */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payable Days</span>
              {isEditingPayableDays ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={editablePayableDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      // Ensure value is between 0 and 30
                      if (value >= 0 && value <= 30) {
                        setEditablePayableDays(value)
                      }
                    }}
                    className="w-20 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePayableDaysSave}
                    className="h-6 w-6 p-0 text-green-600"
                  >
                    ✓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePayableDaysCancel}
                    className="h-6 w-6 p-0 text-red-600"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">
                    {editablePayableDays || employee?.presentDays || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditablePayableDays(employee?.presentDays || 0)
                      setIsEditingPayableDays(true)
                    }}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                </div>
              )}
            </div>

            {/* Past Days */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Arrears Days</span>
              {isEditingPastDays ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={editablePastDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      // Ensure value is between 0 and 30
                      if (value >= 0 && value <= 30) {
                        setEditablePastDays(value)
                      }
                    }}
                    className="w-20 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePastDaysSave}
                    className="h-6 w-6 p-0 text-green-600"
                  >
                    ✓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePastDaysCancel}
                    className="h-6 w-6 p-0 text-red-600"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">
                    {editablePastDays || employee?.pastDays || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditablePastDays(employee?.pastDays || 0)
                      setIsEditingPastDays(true)
                    }}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div>
          <div className="mb-2 grid grid-cols-3 gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold text-green-600">
              (+) EARNINGS
            </h3>
            <span className="text-right text-sm font-medium">Basic </span>
            <span className="text-right text-sm font-medium">Current </span>
          </div>

          <div className="space-y-1">
            {displayData
              .filter((item) => item.componentType?.toLowerCase() === "earning")
              .map((item) => (
                <div key={item.componentId}>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-sm font-medium">
                      {item.componentName}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.basicAmount || 0)}
                      </span>
                    </div>

                    {editingEarningId === item.componentId ? (
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          min="0"
                          value={editableEarningAmounts[item.componentId] || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            if (value >= 0) {
                              setEditableEarningAmounts((prev) => ({
                                ...prev,
                                [item.componentId]: value,
                              }))
                            }
                          }}
                          className="w-24 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEarningSave(item.componentId)}
                          className="h-6 w-6 p-0 text-green-600"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEarningCancel}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm font-medium">
                          {formatNumber(item.amount || 0)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditableEarningAmounts((prev) => ({
                              ...prev,
                              [item.componentId]: item.amount || 0,
                            }))
                            setEditingEarningId(item.componentId)
                          }}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {displayData.filter(
              (item) => item.componentType?.toLowerCase() === "earning"
            ).length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No earnings found
              </div>
            )}
          </div>
        </div>

        {/* Deductions Section */}
        <div>
          <div className="mb-3 grid grid-cols-3 gap-4 border-b pb-2">
            <h3 className="text-sm font-semibold text-red-600">
              (-) DEDUCTIONS
            </h3>
          </div>

          <div className="space-y-1">
            {displayData
              .filter(
                (item) => item.componentType?.toLowerCase() === "deduction"
              )
              .map((item) => (
                <div key={item.componentId}>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-sm font-medium">
                      {item.componentName}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.basicAmount || 0)}
                      </span>
                    </div>
                    {editingDeductionId === item.componentId ? (
                      <div className="flex items-center justify-end space-x-2">
                        <Input
                          type="number"
                          min="0"
                          value={
                            editableDeductionAmounts[item.componentId] || 0
                          }
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            if (value >= 0) {
                              setEditableDeductionAmounts((prev) => ({
                                ...prev,
                                [item.componentId]: value,
                              }))
                            }
                          }}
                          className="w-24 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeductionSave(item.componentId)}
                          className="h-6 w-6 p-0 text-green-600"
                        >
                          ✓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDeductionCancel}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm font-medium">
                          {formatNumber(item.amount || 0)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditableDeductionAmounts((prev) => ({
                              ...prev,
                              [item.componentId]: item.amount || 0,
                            }))
                            setEditingDeductionId(item.componentId)
                          }}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {displayData.filter(
              (item) => item.componentType?.toLowerCase() === "deduction"
            ).length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No earnings found
              </div>
            )}
          </div>
        </div>

        {/* Net Pay Summary */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="text-sm font-medium">NET PAY</span>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-bold">
                <CurrencyFormatter amount={currentBasicNetPay} />
              </span>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-bold">
                <CurrencyFormatter amount={currentNetPay} />
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 border-t pt-6">
          <Button variant="outline" onClick={onCloseAction}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowSaveConfirmation(true)}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Save Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to save the changes to this employee&apos;s
              payroll? This will update the payable days and component amounts.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSaveConfirmation(false)
                  handleSave()
                }}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? "Saving..." : "Yes, Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
