"use client"

import React, { useMemo, useState } from "react"
import { IPayrollComponentGLMapping } from "@/interfaces/payroll"
import {
  Building,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  Landmark,
  Plus,
  RefreshCcw,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PayrollAccountIntegrationTableProps {
  mappings: IPayrollComponentGLMapping[]
  onView?: (mapping: IPayrollComponentGLMapping) => void
  onEditAction?: (mapping: IPayrollComponentGLMapping) => void
  onDeleteAction?: (mapping: IPayrollComponentGLMapping) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
}

export function PayrollAccountIntegrationTable({
  mappings,
  onView,
  onEditAction,
  onDeleteAction,
  onCreateAction,
  onRefreshAction,
}: PayrollAccountIntegrationTableProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(
    new Set()
  )

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  // Group mappings by company
  const groupedMappings = useMemo(() => {
    const groups: Record<string, IPayrollComponentGLMapping[]> = {}

    mappings.forEach((mapping) => {
      const companyKey = mapping.companyName || `Company ${mapping.companyId}`
      if (!groups[companyKey]) {
        groups[companyKey] = []
      }
      groups[companyKey].push(mapping)
    })

    return groups
  }, [mappings])

  const toggleCompany = (companyName: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName)
    } else {
      newExpanded.add(companyName)
    }
    setExpandedCompanies(newExpanded)
  }

  const isCompanyExpanded = (companyName: string) => {
    return expandedCompanies.has(companyName)
  }

  const totalMappings = mappings.length
  const totalActiveMappings = mappings.filter(
    (mapping) => mapping.isActive
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex min-w-0 items-center gap-2 overflow-hidden">
              <Landmark className="h-5 w-5" />
              Account Integration
            </CardTitle>
            <CardDescription>
              Manage GL account mappings for payroll components
            </CardDescription>
          </div>
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                console.log("Refresh button clicked for account integration")
                onRefreshAction?.()
              }}
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allCompanies = Object.keys(groupedMappings)
                if (expandedCompanies.size === allCompanies.length) {
                  // Collapse all
                  setExpandedCompanies(new Set())
                } else {
                  // Expand all
                  setExpandedCompanies(new Set(allCompanies))
                }
              }}
              title={
                expandedCompanies.size === Object.keys(groupedMappings).length
                  ? "Collapse All"
                  : "Expand All"
              }
            >
              {expandedCompanies.size === Object.keys(groupedMappings).length
                ? "Collapse All"
                : "Expand All"}
            </Button>
            <Button
              className="flex min-w-0 items-center gap-2 overflow-hidden"
              size="sm"
              onClick={onCreateAction}
            >
              <Plus className="h-4 w-4" />
              Create Mapping
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="text-muted-foreground mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-2">
              No account mappings found
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Expense GL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="truncate text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedMappings).map(
                  ([companyName, companyMappings]) => {
                    const isExpanded = isCompanyExpanded(companyName)
                    const activeMappings = companyMappings.filter(
                      (mapping) => mapping.isActive
                    ).length

                    return (
                      <React.Fragment key={companyName}>
                        {/* Company Header Row */}
                        <TableRow className="bg-muted/50 hover:bg-muted/70">
                          <TableCell colSpan={7}>
                            <div className="flex items-center justify-between">
                              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCompany(companyName)}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <Building className="text-muted-foreground h-4 w-4" />
                                <span className="font-medium">
                                  {companyName}
                                </span>
                                <Badge variant="outline" className="ml-2">
                                  {companyMappings.length} mappings
                                </Badge>
                                <Badge variant="secondary" className="ml-1">
                                  {activeMappings} active
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Company Mappings */}
                        {isExpanded &&
                          companyMappings.map((mapping) => (
                            <TableRow
                              key={mapping.mappingId}
                              className="bg-background"
                            >
                              <TableCell>
                                <div className="pl-6">
                                  {/* Empty space for indentation */}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {mapping.componentName}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {mapping.componentCode}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {mapping.departmentName || "N/A"}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {mapping.expenseGLCode || mapping.glId}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {mapping.expenseGLName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(mapping.isActive || false)}
                              </TableCell>
                              <TableCell>
                                {mapping.createDate
                                  ? new Date(
                                      mapping.createDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="truncate text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView?.(mapping)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Mapping Details
                                        </DialogTitle>
                                        <DialogDescription>
                                          Detailed view of the GL mapping
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-muted-foreground text-sm font-medium">
                                            Company
                                          </label>
                                          <p className="font-medium">
                                            {mapping.companyName}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-muted-foreground text-sm font-medium">
                                            Component
                                          </label>
                                          <p className="font-medium">
                                            {mapping.componentName}
                                          </p>
                                          <p className="text-muted-foreground text-sm">
                                            Code: {mapping.componentCode}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-muted-foreground text-sm font-medium">
                                            Department
                                          </label>
                                          <p className="font-medium">
                                            {mapping.departmentName || "N/A"}
                                          </p>
                                        </div>
                                        {mapping.glId && (
                                          <div>
                                            <label className="text-muted-foreground text-sm font-medium">
                                              Expense GL Account
                                            </label>
                                            <p className="font-medium">
                                              {mapping.expenseGLCode ||
                                                mapping.glId}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <label className="text-muted-foreground text-sm font-medium">
                                            Status
                                          </label>
                                          <div className="mt-1">
                                            {getStatusBadge(
                                              mapping.isActive || false
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-muted-foreground text-sm font-medium">
                                            Created Date
                                          </label>
                                          <p className="text-sm">
                                            {mapping.createDate
                                              ? new Date(
                                                  mapping.createDate
                                                ).toLocaleDateString()
                                              : "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditAction?.(mapping)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>

                                  {onDeleteAction && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDeleteAction(mapping)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    )
                  }
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
          <div>
            Showing {totalMappings} mappings across{" "}
            {Object.keys(groupedMappings).length} companies
            {Object.keys(groupedMappings).length > 0 && (
              <span className="ml-2">({expandedCompanies.size} expanded)</span>
            )}
          </div>
          <div>
            <span>{totalActiveMappings} active mappings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
