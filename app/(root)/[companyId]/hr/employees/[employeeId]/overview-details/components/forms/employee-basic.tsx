"use client"

import { useCompanyStore } from "@/stores/company-store"

import React, { useMemo } from "react"
import { IEmployeeBasic } from "@/interfaces/employee"
import { EmployeeBasicValues, employeeBasicSchema } from "@/schemas/employee"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { useSaveEmployeeBasic } from "@/hooks/use-employee"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  ContractTypeAutocomplete,
  CountryAutocomplete,
  DayOfWeekAutocomplete,
  DepartmentAutocomplete,
  DesignationAutocomplete,
  EmployerAutocomplete,
  EmploymentTypeAutocomplete,
  GenderAutocomplete,
  WorkLocationAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface Props {
  employee?: IEmployeeBasic
  onCancelAction?: () => void
}

export function EmployeeBasicForm({ employee, onCancelAction }: Props) {
  const decimals = useCompanyStore((state) => state.decimals)
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const saveMutation = useSaveEmployeeBasic()

  // Debug logging
  console.log("Employee data in basic dialog:", employee)

  const form = useForm<EmployeeBasicValues>({
    resolver: zodResolver(employeeBasicSchema),
    defaultValues: {
      employeeId: employee?.employeeId || 0,
      employerId: employee?.employerId || 0,
      employeeCode: employee?.employeeCode || "",
      employeeName: employee?.employeeName || "",
      photo: employee?.photo || "",
      departmentId: employee?.departmentId || 0,
      designationId: employee?.designationId || 0,
      workLocationId: employee?.workLocationId || 0,
      genderId: employee?.genderId || 0,
      dayOfWeek: employee?.dayOfWeek || 0,
      joinDate: employee?.joinDate
        ? format(
            parseDate(employee?.joinDate as unknown as string) || new Date(),
            dateFormat
          )
        : "",

      lastDate: employee?.lastDate
        ? format(
            parseDate(employee?.lastDate as unknown as string) || new Date(),
            dateFormat
          )
        : "",
      offPhoneNo: employee?.offPhoneNo || "",
      offEmailAdd: employee?.offEmailAdd || "",
      nationalityId: employee?.nationalityId || 0,
      employmentType: employee?.employmentType || "",
      contractType: employee?.contractType || "",
      remarks: employee?.remarks || "",
      isActive: employee?.isActive ?? true,
    },
  })

  // Reset form when employee data changes
  React.useEffect(() => {
    if (employee) {
      const formData = {
        employeeId: employee.employeeId || 0,
        employerId: employee.employerId || 0,
        employeeCode: employee.employeeCode || "",
        employeeName: employee.employeeName || "",
        photo: employee.photo || "",
        departmentId: employee.departmentId || 0,
        designationId: employee.designationId || 0,
        workLocationId: employee.workLocationId || 0,
        genderId: employee.genderId || 0,
        dayOfWeek: employee.dayOfWeek || 0,
        joinDate: employee?.joinDate
          ? format(
              parseDate(employee?.joinDate as unknown as string) || new Date(),
              dateFormat
            )
          : "",

        lastDate: employee?.lastDate
          ? format(
              parseDate(employee?.lastDate as unknown as string) || new Date(),
              dateFormat
            )
          : "",
        offPhoneNo: employee.offPhoneNo || "",
        offEmailAdd: employee.offEmailAdd || "",
        nationalityId: employee.nationalityId || 0,
        employmentType: employee.employmentType || "",
        contractType: employee.contractType || "",
        remarks: employee.remarks || "",
        isActive: employee.isActive ?? true,
      }

      console.log("Setting form data:", formData)
      form.reset(formData)
    }
  }, [employee, form, dateFormat])

  // Debug current form values
  const currentValues = form.watch()
  console.log("Current form values:", currentValues)

  const onSubmit = (data: EmployeeBasicValues) => {
    console.log("🔘 Submit button clicked!")
    console.log("Form data:", data)
    console.log("Form is valid:", form.formState.isValid)
    console.log("Form errors:", form.formState.errors)

    // Format dates for API submission
    const processedData = {
      employeeId: data.employeeId || 0,
      employerId: data.employerId || 0,
      employeeCode: data.employeeCode || "",
      employeeName: data.employeeName || "",
      photo: data.photo || "",
      departmentId: data.departmentId || 0,
      designationId: data.designationId || 0,
      workLocationId: data.workLocationId || 0,
      genderId: data.genderId || 0,
      dayOfWeek: data.dayOfWeek || 0,
      joinDate: formatDateForApi(data.joinDate) || "",
      lastDate: formatDateForApi(data.lastDate) || "",
      offPhoneNo: data.offPhoneNo || "",
      offEmailAdd: data.offEmailAdd || "",
      nationalityId: data.nationalityId || 0,
      employmentType: data.employmentType || "",
      contractType: data.contractType || "",
      remarks: data.remarks || "",
      isActive: data.isActive ?? true,
    }

    saveMutation.mutate(processedData as EmployeeBasicValues)
  }

  const handleSubmit = form.handleSubmit(onSubmit)

  const handleSaveClick = () => {
    console.log("🔘 Save button clicked manually!")
    console.log("Form is valid:", form.formState.isValid)
    console.log("Form errors:", form.formState.errors)

    // Trigger form submission manually
    handleSubmit()
  }

  // Watch for successful save and close dialog
  React.useEffect(() => {
    if (saveMutation.isSuccess && !saveMutation.isPending) {
      console.log("✅ Save successful! Closing dialog...")
      form.reset()
      onCancelAction?.()
    }
  }, [saveMutation.isSuccess, saveMutation.isPending, form, onCancelAction])

  const handleCancel = () => {
    form.reset()
    onCancelAction?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <EmployerAutocomplete
            form={form}
            label="Company"
            name="employerId"
            isRequired={true}
          />
          <CustomInput
            form={form}
            label="Employee Code"
            name="employeeCode"
            placeholder="Enter employee code"
            isRequired
          />
          <CustomInput
            form={form}
            label="Employee Name"
            name="employeeName"
            placeholder="Enter employee name"
            isRequired
          />
          <EmploymentTypeAutocomplete
            form={form}
            label="Employment Type"
            name="employmentType"
          />

          <DepartmentAutocomplete
            form={form}
            label="Department"
            name="departmentId"
          />

          <DesignationAutocomplete
            form={form}
            label="Designation"
            name="designationId"
          />

          <WorkLocationAutocomplete
            form={form}
            label="Work Location"
            name="workLocationId"
          />
          <GenderAutocomplete form={form} label="Gender" name="genderId" />
          <DayOfWeekAutocomplete
            form={form}
            label="Day of Week"
            name="dayOfWeek"
            isRequired
          />
          <CustomDateNew form={form} label="Date of Joining" name="joinDate" />
          <ContractTypeAutocomplete
            form={form}
            label="Contract Type"
            name="contractType"
          />

          <CustomInput
            form={form}
            label="Office Phone Number"
            name="offPhoneNo"
            placeholder="Enter office phone number"
          />

          <CustomInput
            form={form}
            label="Office Email Address"
            name="offEmailAdd"
            placeholder="Enter office email address"
          />

          <CountryAutocomplete
            form={form}
            label="Nationality"
            name="nationalityId"
          />

          <CustomSwitch form={form} label="Is Active" name="isActive" />
        </div>
        <CustomTextarea form={form} label="Remarks" name="remarks" />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
