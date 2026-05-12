"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { IEmployeeBasic } from "@/interfaces/employee"
import { RefreshCw, Search } from "lucide-react"
import { useForm } from "react-hook-form"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DepartmentAutocomplete,
  DesignationAutocomplete,
  EmployerAutocomplete,
} from "@/components/autocomplete"

interface Props {
  data: IEmployeeBasic[]
  onRefreshAction?(): void
  onEditAction(item: IEmployeeBasic): void
}

export function EmployeeListTable({
  data,
  onRefreshAction,
  onEditAction,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get search term and highlighted employee from URL params
  const urlSearch = searchParams.get("search") || ""
  const highlightedEmployeeId = searchParams.get("highlight") || ""
  const [search, setSearch] = useState(urlSearch)

  // State for autocomplete filters
  const [selectedEmployerId, setSelectedEmployerId] = useState<number | null>(
    null
  )
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null)
  const [selectedDesignationId, setSelectedDesignationId] = useState<
    number | null
  >(null)

  // Create a form instance for the autocomplete components
  const form = useForm<Record<string, unknown>>()

  // Update URL when search changes
  const updateSearchParams = useCallback(
    (newSearch: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newSearch) {
        params.set("search", newSearch)
      } else {
        params.delete("search")
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  // Sync local state with URL params
  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  // Debounced URL update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSearchParams(search)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, updateSearchParams])

  // Scroll to highlighted row when page loads
  useEffect(() => {
    if (highlightedEmployeeId) {
      const highlightedRow = document.querySelector(
        `[data-employee-id="${highlightedEmployeeId}"]`
      )
      if (highlightedRow) {
        highlightedRow.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        // Remove highlight after scrolling
        setTimeout(() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("highlight")
          router.push(`${pathname}?${params.toString()}`)
        }, 2000)
      }
    }
  }, [
    highlightedEmployeeId,
    router,
    pathname,
    searchParams,
    updateSearchParams,
  ])

  // Filter data based on search and filters
  const filtered = data.filter((employee) => {
    const searchTerm = search.toLowerCase()

    const matchesSearch =
      employee.employeeCode?.toLowerCase().includes(searchTerm) ||
      employee.employeeName?.toLowerCase().includes(searchTerm) ||
      employee.departmentName?.toLowerCase().includes(searchTerm) ||
      employee.designationName?.toLowerCase().includes(searchTerm) ||
      employee.phoneNo?.toLowerCase().includes(searchTerm) ||
      employee.offEmailAdd?.toLowerCase().includes(searchTerm)

    const matchesCompany =
      !selectedEmployerId || employee.employerId === selectedEmployerId
    const matchesDepartment =
      !selectedDepartmentId || employee.departmentId === selectedDepartmentId
    const matchesDesignation =
      !selectedDesignationId || employee.designationId === selectedDesignationId

    return (
      matchesSearch && matchesCompany && matchesDepartment && matchesDesignation
    )
  })

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1)
  }

  return (
    <div className="@container space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <EmployerAutocomplete
            form={form}
            onChangeEvent={(selectedOption) => {
              setSelectedEmployerId(
                selectedOption ? selectedOption.employerId : null
              )
            }}
          />
          <DepartmentAutocomplete
            form={form}
            onChangeEvent={(selectedOption) => {
              setSelectedDepartmentId(
                selectedOption ? selectedOption.departmentId : null
              )
            }}
          />
          <DesignationAutocomplete
            form={form}
            onChangeEvent={(selectedOption) => {
              setSelectedDesignationId(
                selectedOption ? selectedOption.designationId : null
              )
            }}
          />
          <Badge variant="outline">
            {filtered.length} employees
            {search && ` (filtered from ${data.length})`}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshAction}
            className="h-8 px-2 lg:px-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${pathname}/add`)}
            className="h-8 px-2 lg:px-3"
          >
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          {/* Header table */}
          <Table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[200px] min-w-[180px]" />
              <col className="w-[150px] min-w-[120px]" />
              <col className="w-[120px] min-w-[100px]" />
              <col className="w-[120px] min-w-[100px]" />
              <col className="w-[80px] min-w-[70px]" />
            </colgroup>
            <TableHeader className="bg-background sticky top-0 z-20">
              <TableRow className="bg-muted/50">
                <TableHead className="bg-muted/50 sticky left-0 z-30">
                  Employee
                </TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* Scrollable body table */}
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[200px] min-w-[180px]" />
                <col className="w-[150px] min-w-[120px]" />
                <col className="w-[120px] min-w-[100px]" />
                <col className="w-[120px] min-w-[100px]" />
                <col className="w-[80px] min-w-[70px]" />
              </colgroup>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((employee) => (
                    <TableRow
                      key={employee.employeeId}
                      data-employee-id={employee.employeeId}
                      className={`hover:bg-muted/50 cursor-pointer ${
                        highlightedEmployeeId === employee.employeeId.toString()
                          ? "border-l-4 border-l-blue-500 bg-card dark:bg-blue-950/20"
                          : ""
                      }`}
                      onClick={() => onEditAction(employee)}
                    >
                      <TableCell className="bg-background sticky left-0 z-10 py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {getInitials(employee.employeeName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-medium">
                              {employee.employeeName} ({employee.employeeCode})
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {employee.employerName || "N/A"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {employee.departmentName || "N/A"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {employee.designationName || "N/A"}
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(employee.isActive || false)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Table>
      </div>
    </div>
  )
}
