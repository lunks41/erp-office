"use client"

import { useEffect, useState } from "react"
import { IUserRights } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { IUserLookup } from "@/interfaces/lookup"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useUserRightSave, useUserRightbyidGet } from "@/hooks/use-admin"
import { useUserGroupLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserAutocomplete } from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { SettingTable } from "@/components/table/table-setting"

type CompanyRight = {
  companyId: string
  companyCode: string
  companyName: string
  isAccess: boolean
  userGroupId: string
}

export function UserRightsTable() {
  const form = useForm()
  const [selectedUser, setSelectedUser] = useState<IUserLookup | null>(null)
  const [companyRights, setCompanyRights] = useState<CompanyRight[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Fetch user groups for dropdown
  const {
    data: userGroups = [],
    isLoading: isLoadingUserGroups,
    error: userGroupsError,
  } = useUserGroupLookup()

  // Fetch user rights for selected user
  const {
    data: userRightsData,
    refetch: refetchUserRights,
    isFetching: isRightsLoading,
  } = useUserRightbyidGet(Number(selectedUser?.userId) || 0)
  // Save user rights muuseUserRightSave()

  const userRightSave = useUserRightSave()

  // Update companyRights when userRightsData cs
  useEffect(() => {
    if (userRightsData) {
      const response = userRightsData as ApiResponse<IUserRights>

      if (response.data && Array.isArray(response.data)) {
        setCompanyRights(
          response.data.map((right) => ({
            companyId: right.companyId.toString(),
            companyCode: right.companyCode,
            companyName: right.companyName,
            isAccess: right.isAccess,
            userGroupId: right.userGroupId.toString(),
          }))
        )
      } else {
        setCompanyRights([])
      }
    } else {
      setCompanyRights([])
    }
  }, [userRightsData])

  // When user changes, refetch rights
  useEffect(() => {
    if (selectedUser) {
      refetchUserRights()
    } else {
      setCompanyRights([])
    }
  }, [selectedUser, refetchUserRights])

  // Handle checkbox change for a specific row
  const handleAccessChange = (companyId: string, checked: boolean) => {
    setCompanyRights((prev) =>
      prev.map((row) =>
        row.companyId === companyId
          ? {
              ...row,
              isAccess: checked,
              // Clear userGroupId if access is turned off
              userGroupId: checked ? row.userGroupId : "",
            }
          : row
      )
    )
  }

  // Handle user group change for a specific row
  const handleGroupChange = (companyId: string, group: string) => {
    setCompanyRights((prev) =>
      prev.map((row) =>
        row.companyId === companyId ? { ...row, userGroupId: group } : row
      )
    )
  }

  // Validate company rights before saving
  const validateCompanyRights = (): boolean => {
    const invalidRows = companyRights.filter(
      (row) => row.isAccess && !row.userGroupId
    )

    if (invalidRows.length > 0) {
      const companyNames = invalidRows.map((row) => row.companyName).join(", ")
      toast.error(
        `Please select a user group for the following companies with access enabled: ${companyNames}`
      )
      return false
    }
    return true
  }

  // Define columns for the table
  const columns: ColumnDef<CompanyRight>[] = [
    {
      accessorKey: "companyCode",
      header: "Company Code",
      size: 150,
    },
    {
      accessorKey: "companyName",
      header: "Company Name",
      size: 200,
    },
    {
      id: "isAccess",
      header: "Is Access",
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isAccess}
          onCheckedChange={(checked) =>
            handleAccessChange(row.original.companyId, Boolean(checked))
          }
        />
      ),
      size: 120,
    },
    {
      id: "userGroupId",
      header: "User Group",
      cell: ({ row }) => (
        <Select
          value={row.original.userGroupId}
          onValueChange={(value) =>
            handleGroupChange(row.original.companyId, value)
          }
          disabled={!row.original.isAccess}
        >
          <SelectTrigger
            className={cn(
              "w-full",
              row.original.isAccess &&
                !row.original.userGroupId &&
                "border-red-500"
            )}
          >
            <SelectValue placeholder="Select Group" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingUserGroups ? (
              <SelectItem value="loading" disabled>
                Loading groups...
              </SelectItem>
            ) : userGroupsError ? (
              <SelectItem value="error" disabled>
                Error loading groups
              </SelectItem>
            ) : userGroups.length === 0 ? (
              <SelectItem value="no-groups" disabled>
                No groups available
              </SelectItem>
            ) : (
              userGroups.map((g) => (
                <SelectItem
                  key={g.userGroupId}
                  value={g.userGroupId.toString()}
                >
                  {g.userGroupName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ),
      size: 200,
    },
  ]

  // Handle save button click
  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first")
      return
    }

    // Validate before saving
    if (!validateCompanyRights()) {
      return
    }
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first")
      return
    }

    // Validate before saving
    if (!validateCompanyRights()) {
      return
    }

    try {
      setSaving(true)
      const rightsToSave = companyRights.map((row) => ({
        companyId: Number(row.companyId),
        companyCode: row.companyCode,
        companyName: row.companyName,
        isAccess: row.isAccess,
        userId: Number(selectedUser.userId),
        userGroupId: Number(row.userGroupId),
      }))

      await userRightSave.mutateAsync({ data: rightsToSave })
      toast.success("User rights saved successfully")
      refetchUserRights()
    } catch (error) {
      console.error("Error saving user rights:", error)
      toast.error("Failed to save user rights")
    } finally {
      setSaving(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!selectedUser) {
      setCompanyRights([])
      toast.warning("Please select a user first")
      return
    }
    refetchUserRights()
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearch)}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-end gap-4">
              <div className="w-64">
                <UserAutocomplete
                  form={form}
                  name="userId"
                  label="User"
                  onChangeEvent={(user: IUserLookup | null) =>
                    setSelectedUser(user)
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                disabled={isRightsLoading}
              >
                {isRightsLoading ? "Loading..." : "Search"}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !selectedUser}
              size="sm"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          <SettingTable
            data={companyRights}
            columns={columns}
            isLoading={isRightsLoading}
            emptyMessage="No data. Please select a user."
            maxHeight="460px"
          />
        </form>
      </Form>
      <SaveConfirmation
        title="Save User Rights"
        itemName={`user rights for ${selectedUser?.userName || "selected user"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
