"use client"

import { useCallback, useState } from "react"
import { AttendanceFormValue } from "@/schemas/attendance"
import { Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Hr_Attendance } from "@/lib/api-routes"
import { usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { MonthYearAutocomplete } from "@/components/autocomplete"

import { AttendanceTable } from "./components/attendance-table"

interface AttendancePageForm extends Record<string, unknown> {
  selectedMonth: string
}

export default function AttendancePage() {
  const [attendanceChanges, setAttendanceChanges] = useState<
    AttendanceFormValue[]
  >([])

  // Save attendance hook
  const saveAttendance = usePersist<AttendanceFormValue[]>(
    Hr_Attendance.saveBulk
  )

  const form = useForm<AttendancePageForm>({
    defaultValues: {
      selectedMonth: new Date().toISOString().slice(0, 7), // Current month in YYYY-MM format
    },
  })

  const selectedMonth = form.watch("selectedMonth")

  const handleMonthChange = useCallback(
    (selectedOption: { value: string; label: string } | null) => {
      if (selectedOption) {
        form.setValue("selectedMonth", selectedOption.value)
        toast.info(`Switched to ${selectedOption.label}`)
      }
    },
    [form]
  )

  const handleAttendanceChange = useCallback(
    (changes: AttendanceFormValue[]) => {
      setAttendanceChanges(changes)
    },
    []
  )

  const handleSaveAttendance = useCallback(() => {
    if (attendanceChanges.length === 0) {
      toast.warning("No changes to save")
      return
    }

    saveAttendance.mutate(attendanceChanges, {
      onSuccess: (response) => {
        if (response.result === 1) {
          toast.success("Attendance saved successfully")
          setAttendanceChanges([]) // Clear changes after successful save
        } else {
          toast.error("Failed to save attendance")
        }
      },
      onError: () => {
        toast.error("Failed to save attendance")
      },
    })
  }, [attendanceChanges, saveAttendance])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Attendance Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor and manage employee attendance records
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <MonthYearAutocomplete
              form={form}
              name="selectedMonth"
              onChangeEvent={handleMonthChange}
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveAttendance}
              disabled={
                attendanceChanges.length === 0 || saveAttendance.isPending
              }
              className="flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              {saveAttendance.isPending ? "Saving..." : `Save`}
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Table Section */}
      <div className="space-y-4">
        <AttendanceTable
          selectedMonth={selectedMonth}
          onAttendanceChange={handleAttendanceChange}
        />
      </div>
    </div>
  )
}
