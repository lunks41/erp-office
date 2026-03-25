"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { IEmployeeAttendance } from "@/interfaces/attendance"
import { AttendanceFormValue } from "@/schemas/attendance"

import { Hr_Attendance } from "@/lib/api-routes"
import { useGetByPath } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

interface BulkAttendanceData {
  employeeId: string
  employeeName: string
  companyId: number
  companyName: string
  days: {
    date: string // always YYYY-MM-DD
    status: "P" | "A" | "WK" | "VL"
  }[]
}

interface AttendanceGridProps {
  selectedMonth?: string
  onAttendanceChange?: (changes: AttendanceFormValue[]) => void
}

export function AttendanceTable({
  selectedMonth,
  onAttendanceChange,
}: AttendanceGridProps) {
  // Avoid SSR/client mismatch: only set default month on client
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    selectedMonth || ""
  )
  const [bulkData, setBulkData] = useState<BulkAttendanceData[]>([])
  const previousRecordsRef = useRef<AttendanceFormValue[]>([])

  // Fetch employees data with selected month
  const { data: employeesResponse, isLoading } =
    useGetByPath<IEmployeeAttendance>(
      Hr_Attendance.getV1,
      "employees",
      selectedMonthYear
    )

  const employees = useMemo(
    () => employeesResponse?.data || [],
    [employeesResponse?.data]
  )
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

      const newBulkData = employeeList.map((employee: IEmployeeAttendance) => ({
        employeeId: employee.employeeId || "",
        employeeName: employee.employeeName || "",
        companyId: employee.companyId || 0,
        companyName: employee.companyName || "",
        days: days.map((day) => {
          // Find existing attendance record for this day
          let existingRecord = undefined

          if (Array.isArray(employee.dailyRecords)) {
            // If it's an array, use find method
            existingRecord = employee.dailyRecords.find(
              (record) => record.date === day.fullDate
            )
          } else if (
            employee.dailyRecords &&
            typeof employee.dailyRecords === "object"
          ) {
            // If it's an object with numeric keys, find by day number
            const dayNumber = day.day
            existingRecord =
              employee.dailyRecords[
                dayNumber as keyof typeof employee.dailyRecords
              ]
          }

          return {
            date: day.fullDate,
            status: (existingRecord?.status || "A") as "P" | "A" | "WK" | "VL",
          }
        }),
      }))

      setBulkData(newBulkData)
    } else {
      setBulkData([])
    }
  }, [employees, days, selectedMonthYear, isLoading])

  // Set initial month on client only
  useEffect(() => {
    if (selectedMonth) {
      setSelectedMonthYear(selectedMonth)
    } else if (selectedMonthYear === "") {
      setSelectedMonthYear(formatMonth(new Date()))
    }
  }, [selectedMonth, selectedMonthYear])

  // Memoize attendance records to prevent unnecessary recalculations
  const attendanceRecords = useMemo(() => {
    if (bulkData.length === 0) return []

    const records: AttendanceFormValue[] = []
    bulkData.forEach((employee) => {
      employee.days.forEach((day) => {
        records.push({
          employeeId: Number(employee.employeeId),
          date: day.date,
          status: day.status,
        })
      })
    })
    return records
  }, [bulkData])

  // Update parent's attendance changes when attendanceRecords change
  useEffect(() => {
    if (onAttendanceChange && attendanceRecords.length > 0) {
      // Only call onAttendanceChange if the records have actually changed
      const previousRecords = previousRecordsRef.current
      const hasChanged =
        JSON.stringify(previousRecords) !== JSON.stringify(attendanceRecords)

      if (hasChanged) {
        previousRecordsRef.current = attendanceRecords
        onAttendanceChange(attendanceRecords)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onAttendanceChange omitted to prevent infinite loop
  }, [attendanceRecords])

  const getAttendanceCounts = (employeeId: string) => {
    const employee = bulkData.find((emp) => emp.employeeId === employeeId)
    if (!employee) return { totalpresentCount: 0, totalCount: 0 }

    const presentCount = employee.days.filter(
      (day) => day.status === "P"
    ).length
    const weekendCount = employee.days.filter(
      (day) => day.status === "WK"
    ).length
    const vacationCount = employee.days.filter(
      (day) => day.status === "VL"
    ).length
    const totalCount = employee.days.length

    const totalpresentCount = presentCount + weekendCount + vacationCount

    return { totalpresentCount, totalCount }
  }

  return (
    <div className="@container space-y-4">
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
              <TableRow className="bg-muted/50">
                <TableHead className="bg-muted/50 sticky left-0 z-30">
                  Employee
                </TableHead>
                {days.map((day) => (
                  <TableHead
                    key={day.day}
                    className="border-muted-foreground/10 bg-muted/30 border-l px-0 py-1 text-center"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] leading-none font-bold">
                        {day.day.toString().padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground text-[10px] leading-none">
                        {day.dayName}
                      </span>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-5 w-5 border-green-200 bg-green-100 p-0 text-[10px] text-green-800 hover:bg-green-200"
                          onClick={() => {
                            setBulkData((prev) =>
                              prev.map((employee) => ({
                                ...employee,
                                days: employee.days.map((d) =>
                                  d.date === day.fullDate
                                    ? { ...d, status: "P" as const }
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
                          size="icon"
                          className="h-5 w-5 border-red-200 bg-red-100 p-0 text-[10px] text-red-800 hover:bg-red-200"
                          onClick={() => {
                            setBulkData((prev) =>
                              prev.map((employee) => ({
                                ...employee,
                                days: employee.days.map((d) =>
                                  d.date === day.fullDate
                                    ? { ...d, status: "A" as const }
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
                          size="icon"
                          className="h-5 w-5 border-blue-200 bg-blue-100 p-0 text-[10px] text-blue-800 hover:bg-blue-200"
                          onClick={() => {
                            setBulkData((prev) =>
                              prev.map((employee) => ({
                                ...employee,
                                days: employee.days.map((d) =>
                                  d.date === day.fullDate
                                    ? { ...d, status: "WK" as const }
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
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[200px] min-w-[180px]" />
                {days.map((day) => (
                  <col key={day.day} className="w-[45px] min-w-[40px]" />
                ))}
              </colgroup>
              <TableBody>
                {bulkData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={days.length + 1}
                      className="text-center"
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  bulkData.map((employee) => {
                    const { totalpresentCount } = getAttendanceCounts(
                      employee.employeeId
                    )
                    return (
                      <TableRow key={employee.employeeId} className="group">
                        <TableCell className="bg-background sticky left-0 z-10 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">
                                {employee.employeeName}
                              </div>
                              <div className="text-muted-foreground truncate text-xs">
                                {employee.companyName}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-background flex-shrink-0 text-xs"
                            >
                              {totalpresentCount}
                            </Badge>
                          </div>
                        </TableCell>
                        {employee.days.map((day) => (
                          <TableCell
                            key={day.date}
                            className="border-muted-foreground/10 border-l bg-white px-0 py-1 text-center dark:bg-black/10"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className={`h-6 w-6 rounded p-0 text-[11px] font-semibold ${
                                day.status === "P"
                                  ? "border-green-200 bg-green-100 text-green-800"
                                  : day.status === "A"
                                    ? "border-red-200 bg-red-100 text-red-800"
                                    : day.status === "WK"
                                      ? "border-blue-200 bg-blue-100 text-blue-800"
                                      : "border-gray-200 bg-yellow-100 text-yellow-800"
                              }`}
                              onClick={() => {
                                const statusCycle = [
                                  "P",
                                  "A",
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
                                              ? { ...d, status: nextStatus }
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
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Table>
      </div>
      {/* Legend */}
      <div className="bg-muted/30 border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-3 w-3 rounded border border-green-200 bg-green-100"></div>
              <span>Present (P)</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-3 w-3 rounded border border-red-200 bg-red-100"></div>
              <span>Absent (A)</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-3 w-3 rounded border border-blue-200 bg-blue-100"></div>
              <span>Weekend (WK)</span>
            </div>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <div className="h-3 w-3 rounded border border-gray-200 bg-yellow-100"></div>
              <span>Vacation Leave (VL)</span>
            </div>
          </div>
          {/* Employee Count Badge - Always on the Right */}
          <Badge variant="outline" className="text-sm">
            {bulkData.length} Employees
          </Badge>
        </div>
      </div>
    </div>
  )
}
