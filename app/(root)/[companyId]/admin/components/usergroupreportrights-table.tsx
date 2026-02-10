"use client"

import { useEffect, useState } from "react"
import { IUserGroupReportRights } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useUserGroupReportRightSave,
  useUserGroupReportRightbyidGet,
} from "@/hooks/use-admin"
import { useUserGroupLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { UserGroupAutocomplete } from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { SettingTable } from "@/components/table/table-setting"

type UserGroup = {
  userGroupId: number
  userGroupName: string
}

type PermissionType = "isExport" | "isPrint"

export function UserGroupReportSettingTable() {
  const form = useForm()
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [groupRights, setGroupRights] = useState<IUserGroupReportRights[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  const { data: userGroups = [] } = useUserGroupLookup()

  const watchedUserGroupId = form.watch("userGroupId")

  useEffect(() => {
    if (watchedUserGroupId) {
      const foundGroup = userGroups.find(
        (g) => g.userGroupId === watchedUserGroupId
      )
      setSelectedGroup(
        foundGroup
          ? {
              userGroupId: foundGroup.userGroupId,
              userGroupName: foundGroup.userGroupName,
            }
          : { userGroupId: watchedUserGroupId, userGroupName: "" }
      )
    } else {
      setSelectedGroup(null)
    }
  }, [watchedUserGroupId, userGroups])

  const {
    data: userGroupReportRightsResponse,
    refetch: refetchUserGroupReportRights,
    isFetching: isRightsLoading,
  } = useUserGroupReportRightbyidGet(selectedGroup?.userGroupId || 0)

  const userGroupReportRightSave = useUserGroupReportRightSave()

  useEffect(() => {
    if (userGroupReportRightsResponse) {
      const response =
        userGroupReportRightsResponse as ApiResponse<IUserGroupReportRights>
      if (response.data && Array.isArray(response.data)) {
        setGroupRights(response.data)
      } else {
        setGroupRights([])
      }
    } else {
      setGroupRights([])
    }
  }, [userGroupReportRightsResponse])

  useEffect(() => {
    if (selectedGroup?.userGroupId) {
      refetchUserGroupReportRights()
    } else {
      setGroupRights([])
    }
  }, [selectedGroup?.userGroupId, refetchUserGroupReportRights])

  const handlePermissionChange = (
    moduleId: number,
    transactionId: number,
    permission: PermissionType,
    checked: boolean
  ) => {
    setGroupRights((prev) =>
      prev.map((right) =>
        right.moduleId === moduleId && right.transactionId === transactionId
          ? { ...right, [permission]: checked }
          : right
      )
    )
  }

  const handleRowSelectAll = (
    moduleId: number,
    transactionId: number,
    checked: boolean
  ) => {
    setGroupRights((prev) =>
      prev.map((right) =>
        right.moduleId === moduleId && right.transactionId === transactionId
          ? {
              ...right,
              isExport: checked,
              isPrint: checked,
            }
          : right
      )
    )
  }

  const handleColumnSelectAll = (
    permission: PermissionType,
    checked: boolean
  ) => {
    setGroupRights((prev) =>
      prev.map((right) => ({
        ...right,
        [permission]: checked,
      }))
    )
  }

  const isRowAllSelected = (right: IUserGroupReportRights) => {
    return right.isExport && right.isPrint
  }

  const isColumnAllSelected = (permission: PermissionType) => {
    return (
      groupRights.length > 0 && groupRights.every((right) => right[permission])
    )
  }

  const columns: ColumnDef<IUserGroupReportRights>[] = [
    {
      accessorKey: "moduleName",
      header: "Module",
      size: 150,
    },
    {
      accessorKey: "transactionName",
      header: "Transaction",
      size: 150,
    },
    {
      id: "selectAll",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Select All</span>
          <Checkbox
            checked={
              groupRights.length > 0 && groupRights.every(isRowAllSelected)
            }
            onCheckedChange={(checked) => {
              const isChecked = Boolean(checked)
              setGroupRights((prev) =>
                prev.map((right) => ({
                  ...right,
                  isExport: isChecked,
                  isPrint: isChecked,
                }))
              )
            }}
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={isRowAllSelected(row.original)}
          onCheckedChange={(checked) =>
            handleRowSelectAll(
              row.original.moduleId,
              row.original.transactionId,
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isExport",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Export</span>
          <Checkbox
            checked={isColumnAllSelected("isExport")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isExport", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isExport}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isExport",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isPrint",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Print</span>
          <Checkbox
            checked={isColumnAllSelected("isPrint")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isPrint", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isPrint}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isPrint",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
  ]

  const handleSave = async () => {
    if (!selectedGroup) {
      toast.error("Please select a user group first")
      return
    }
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedGroup) {
      toast.error("Please select a user group first")
      return
    }

    try {
      setSaving(true)
      const rightsToSave = groupRights.map((right) => ({
        ...right,
        userGroupId: selectedGroup.userGroupId,
      }))

      const response = await userGroupReportRightSave.mutateAsync({
        data: rightsToSave,
      })

      if (response.result === 1) {
        toast.success("User group report rights saved successfully")
        refetchUserGroupReportRights()
      } else {
        toast.error(
          response.message || "Failed to save user group report rights"
        )
      }
    } catch (error) {
      console.error("Error saving user group report rights:", error)
      toast.error("Failed to save user group report rights")
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = async () => {
    if (!selectedGroup) {
      setGroupRights([])
      toast.warning("Please select a user group first")
      return
    }
    refetchUserGroupReportRights()
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearch)}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-end gap-4">
              <div className="w-64">
                <UserGroupAutocomplete
                  form={form}
                  name="userGroupId"
                  label="User Group"
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
              disabled={saving || !selectedGroup}
              size="sm"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          <SettingTable
            data={groupRights}
            columns={columns}
            isLoading={isRightsLoading}
            emptyMessage="No data. Please select a user group."
            maxHeight="460px"
          />
        </form>
      </Form>
      <SaveConfirmation
        title="Save User Group Report Rights"
        itemName={`user group report rights for ${selectedGroup?.userGroupName || "selected group"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
