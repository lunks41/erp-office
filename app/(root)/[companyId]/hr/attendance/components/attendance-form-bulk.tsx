"use client"

import { useEffect, useMemo, useState } from "react"
import { AttendanceFormValue, attendanceFormSchema } from "@/schemas/attendance"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Hr_Attendance } from "@/lib/api-routes"
import { usePersist } from "@/hooks/use-common"
import { useGetEmployees } from "@/hooks/use-employee"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormItem, FormMessage } from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MonthYearAutocomplete } from "@/components/autocomplete"

interface BulkAttendanceData {
  employeeId: string
  employeeName: string
  companyId: number
  days: {
    date: string // always YYYY-MM-DD
    status: "P" | "A" | "WK" | "VL"
  }[]
}

interface AttendanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Utility to format date -> YYYY-MM-DD (no time)
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Utility to format month -> YYYY-MM
const formatMonth = (date: Date) => {
  return formatDate(date).substring(0, 7)
}

export function AttendanceBulkForm({
  open,
  onOpenChange,
}: AttendanceFormProps) {
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    formatMonth(new Date())
  )
  const [bulkData, setBulkData] = useState<BulkAttendanceData[]>([])

  // Fetch employees
  const { data: employeesResponse, isLoading } = useGetEmployees()
  const employees = useMemo(
    () => employeesResponse?.data || [],
    [employeesResponse?.data]
  )

  // Bulk attendance save hook
  const bulkSaveAttendance = usePersist<AttendanceFormValue[]>(
    Hr_Attendance.saveBulk
  )

  const form = useForm<AttendanceFormValue>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      employeeId: 0,
      date: formatDate(new Date()),
      status: "A",
    },
  })

  // Generate days for selected month
  const days = useMemo(() => {
    try {
      const [year, month] = selectedMonthYear.split("-").map(Number)
      const daysCount = new Date(year, month, 0).getDate()
      const daysArray = []

      for (let day = 1; day <= daysCount; day++) {
        const date = new Date(year, month - 1, day)
        daysArray.push({
          day,
          dayName: date.toLocaleDateString("en-US", { weekday: "narrow" }),
          fullDate: formatDate(date),
        })
      }

      return daysArray
    } catch {
      return []
    }
  }, [selectedMonthYear])

  // Populate bulk data
  useEffect(() => {
    if (employees && employees.length > 0 && days.length > 0) {
      const employeeList = Array.isArray(employees[0])
        ? employees[0]
        : employees

      const newBulkData = employeeList.map(
        (employee: {
          employeeId?: number
          employeeName?: string
          companyId?: number
        }) => ({
          employeeId: employee.employeeId?.toString() || "",
          employeeName: employee.employeeName || "",
          companyId: employee.companyId || 0,
          days: days.map((day) => ({
            date: day.fullDate,
            status: "A" as const,
          })),
        })
      )

      setBulkData(newBulkData)
    } else {
      setBulkData([])
    }
  }, [employees, days, selectedMonthYear, isLoading])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const currentMonth = formatMonth(new Date())
      form.reset({
        employeeId: 0,
        date: currentMonth,
        status: "A",
      })
      setSelectedMonthYear(currentMonth)
    }
  }, [open, form])

  // Handlers

  const handleSubmit = () => {
    const attendanceRecords: AttendanceFormValue[] = []

    bulkData.forEach((employee) => {
      employee.days.forEach((day) => {
        attendanceRecords.push({
          employeeId: Number(employee.employeeId),
          date: day.date, // already YYYY-MM-DD
          status: day.status,
        })
      })
    })

    bulkSaveAttendance.mutate(attendanceRecords, {
      onSuccess: (response) => {
        if (response.result === 1) {
          onOpenChange(false)
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] !max-w-none overflow-y-auto sm:w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Bulk Attendance Entry
          </DialogTitle>
          <DialogDescription className="text-sm">
            Select employees and mark their attendance for multiple days
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <Form {...form}>
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FormItem>
                  <FormControl>
                    <MonthYearAutocomplete
                      form={form}
                      name="date"
                      onChangeEvent={(value) =>
                        setSelectedMonthYear(value?.value || "")
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Summary Badges */}
              {bulkData.length > 0 && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{employees.length} Employees</Badge>
                  <Badge variant="outline">{days.length} Days</Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={
                    bulkData.length === 0 || bulkSaveAttendance.isPending
                  }
                >
                  {bulkSaveAttendance.isPending ? "Saving..." : "Save"}{" "}
                </Button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    Loading employees...
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Please wait while we fetch the employee data
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {!isLoading && bulkData.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  {/* Header table */}
                  <Table className="w-full table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[200px] min-w-[180px]" />
                      {days.map((day) => (
                        <col key={day.day} className="w-[45px] min-w-[40px]" />
                      ))}
                    </colgroup>
                    <TableHeader className="bg-background sticky top-0 z-20">
                      <TableRow>
                        <TableHead className="bg-muted/50 sticky left-0 z-30">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">Employee</span>
                          </div>
                        </TableHead>
                        {days.map((day) => (
                          <TableHead
                            key={day.day}
                            className="p-0.5 text-center"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-semibold">
                                {day.day.toString().padStart(2, "0")}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {day.dayName}
                              </span>
                              <div className="mt-1 flex flex-col gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-5 w-5 border-green-200 bg-green-100 p-0 text-xs text-green-800 hover:bg-green-200"
                                  onClick={() => {
                                    // Set all employees to Present for this day
                                    setBulkData((prev) =>
                                      prev.map((employee) => ({
                                        ...employee,
                                        days: employee.days.map((d) =>
                                          d.date === day.fullDate
                                            ? {
                                                ...d,
                                                status: "P" as const,
                                              }
                                            : d
                                        ),
                                      }))
                                    )
                                  }}
                                >
                                  P
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-5 w-5 border-red-200 bg-red-100 p-0 text-xs text-red-800 hover:bg-red-200"
                                  onClick={() => {
                                    // Set all employees to Absent for this day
                                    setBulkData((prev) =>
                                      prev.map((employee) => ({
                                        ...employee,
                                        days: employee.days.map((d) =>
                                          d.date === day.fullDate
                                            ? {
                                                ...d,
                                                status: "A" as const,
                                              }
                                            : d
                                        ),
                                      }))
                                    )
                                  }}
                                >
                                  A
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-5 w-5 border-gray-200 bg-gray-100 p-0 text-xs text-gray-800 hover:bg-gray-200"
                                  onClick={() => {
                                    // Set all employees to Weekend for this day
                                    setBulkData((prev) =>
                                      prev.map((employee) => ({
                                        ...employee,
                                        days: employee.days.map((d) =>
                                          d.date === day.fullDate
                                            ? {
                                                ...d,
                                                status: "WK" as const,
                                              }
                                            : d
                                        ),
                                      }))
                                    )
                                  }}
                                >
                                  WK
                                </Button>
                              </div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  </Table>

                  {/* Scrollable body table */}
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[200px] min-w-[180px]" />
                        {days.map((day) => (
                          <col
                            key={day.day}
                            className="w-[45px] min-w-[40px]"
                          />
                        ))}
                      </colgroup>
                      <TableBody>
                        {bulkData.map((employee) => (
                          <TableRow key={employee.employeeId} className="group">
                            <TableCell className="bg-background sticky left-0 z-10 py-2">
                              <div className="flex items-center space-x-2">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium">
                                    {employee.employeeName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            {employee.days.map((day) => (
                              <TableCell
                                key={day.date}
                                className="p-0.5 text-center"
                              >
                                <div className="flex flex-col gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={`h-6 w-6 p-0 text-xs ${
                                      day.status === "P"
                                        ? "border-green-200 bg-green-100 text-green-800"
                                        : day.status === "A"
                                          ? "border-red-200 bg-red-100 text-red-800"
                                          : day.status === "WK"
                                            ? "border-gray-200 bg-gray-100 text-gray-800"
                                            : "border-gray-200 bg-yellow-100 text-yellow-800"
                                    }`}
                                    onClick={() => {
                                      // Cycle through statuses: A -> P -> WK -> VL -> A
                                      const statusCycle = [
                                        "A",
                                        "P",
                                        "WK",
                                        "VL",
                                      ] as const
                                      const currentIndex = statusCycle.indexOf(
                                        day.status
                                      )
                                      const nextIndex =
                                        (currentIndex + 1) % statusCycle.length
                                      const nextStatus = statusCycle[nextIndex]

                                      setBulkData((prev) =>
                                        prev.map((emp) =>
                                          emp.employeeId === employee.employeeId
                                            ? {
                                                ...emp,
                                                days: emp.days.map((d) =>
                                                  d.date === day.date
                                                    ? {
                                                        ...d,
                                                        status: nextStatus,
                                                      }
                                                    : d
                                                ),
                                              }
                                            : emp
                                        )
                                      )
                                    }}
                                  >
                                    {day.status}
                                  </Button>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Table>
              </div>
            )}
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
