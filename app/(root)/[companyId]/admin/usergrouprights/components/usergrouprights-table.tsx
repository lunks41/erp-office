"use client"

import { useEffect, useState } from "react"
import { IUserGroupRights } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useUserGroupRightSave,
  useUserGroupRightbyidGet,
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

type PermissionType =
  | "isRead"
  | "isCreate"
  | "isEdit"
  | "isDelete"
  | "isExport"
  | "isPrint"
  | "isPost"
  | "isDebitNote"
  | "isClone"

export function UserGroupSettingTable() {
  const form = useForm()
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [groupRights, setGroupRights] = useState<IUserGroupRights[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Fetch user group lookup for name resolution
  const { data: userGroups = [] } = useUserGroupLookup()

  // Watch userGroupId to trigger re-render and update selectedGroup
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

  // Fetch user group rights for selected group
  const {
    data: userGroupRightsResponse,
    refetch: refetchUserGroupRights,
    isFetching: isRightsLoading,
  } = useUserGroupRightbyidGet(selectedGroup?.userGroupId || 0)

  // Save user group rights mutation
  const userGroupRightSave = useUserGroupRightSave()

  // Update groupRights when userGroupRightsResponse changes
  useEffect(() => {
    if (userGroupRightsResponse) {
      const response = userGroupRightsResponse as ApiResponse<IUserGroupRights>
      if (response.data && Array.isArray(response.data)) {
        setGroupRights(response.data)
      } else {
        setGroupRights([])
      }
    } else {
      setGroupRights([])
    }
  }, [userGroupRightsResponse])

  // When group changes, refetch rights
  useEffect(() => {
    if (selectedGroup?.userGroupId) {
      refetchUserGroupRights()
    } else {
      setGroupRights([])
    }
  }, [selectedGroup?.userGroupId, refetchUserGroupRights])

  // Handle permission change for a specific right
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

  // Handle select all for a row
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
              isRead: checked,
              isCreate: checked,
              isEdit: checked,
              isDelete: checked,
              isExport: checked,
              isPrint: checked,
              isPost: checked,
              isDebitNote: checked,
              isClone: checked,
            }
          : right
      )
    )
  }

  // Handle select all for a column
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

  // Check if all permissions in a row are selected
  const isRowAllSelected = (right: IUserGroupRights) => {
    return (
      right.isRead &&
      right.isCreate &&
      right.isEdit &&
      right.isDelete &&
      right.isExport &&
      right.isPrint &&
      right.isPost &&
      right.isDebitNote &&
      right.isClone
    )
  }

  // Check if all permissions in a column are selected
  const isColumnAllSelected = (permission: PermissionType) => {
    return (
      groupRights.length > 0 && groupRights.every((right) => right[permission])
    )
  }

  // Define columns for the table
  const columns: ColumnDef<IUserGroupRights>[] = [
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
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
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
                  isRead: isChecked,
                  isCreate: isChecked,
                  isEdit: isChecked,
                  isDelete: isChecked,
                  isExport: isChecked,
                  isPrint: isChecked,
                  isPost: isChecked,
                  isDebitNote: isChecked,
                  isClone: isChecked,
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
      id: "isRead",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>View</span>
          <Checkbox
            checked={isColumnAllSelected("isRead")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isRead", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isRead}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isRead",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isCreate",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Create</span>
          <Checkbox
            checked={isColumnAllSelected("isCreate")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isCreate", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isCreate}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isCreate",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isEdit",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Edit</span>
          <Checkbox
            checked={isColumnAllSelected("isEdit")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isEdit", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isEdit}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isEdit",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isDelete",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Delete</span>
          <Checkbox
            checked={isColumnAllSelected("isDelete")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isDelete", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isDelete}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isDelete",
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
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
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
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
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
    {
      id: "isPost",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Post</span>
          <Checkbox
            checked={isColumnAllSelected("isPost")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isPost", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isPost}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isPost",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isDebitNote",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Debit Note</span>
          <Checkbox
            checked={isColumnAllSelected("isDebitNote")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isDebitNote", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isDebitNote}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isDebitNote",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
    {
      id: "isClone",
      header: () => (
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span>Clone</span>
          <Checkbox
            checked={isColumnAllSelected("isClone")}
            onCheckedChange={(checked) =>
              handleColumnSelectAll("isClone", Boolean(checked))
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.isClone}
          onCheckedChange={(checked) =>
            handlePermissionChange(
              row.original.moduleId,
              row.original.transactionId,
              "isClone",
              Boolean(checked)
            )
          }
        />
      ),
      size: 100,
    },
  ]

  // Handle save button click
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

      const response = await userGroupRightSave.mutateAsync({
        data: rightsToSave,
      })

      if (response.result === 1) {
        toast.success("User group rights saved successfully")
        refetchUserGroupRights()
      } else {
        toast.error(response.message || "Failed to save user group rights")
      }
    } catch (error) {
      console.error("Error saving user group rights:", error)
      toast.error("Failed to save user group rights")
    } finally {
      setSaving(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!selectedGroup) {
      setGroupRights([])
      toast.warning("Please select a user group first")
      return
    }
    refetchUserGroupRights()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Form {...form}>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(handleSearch)}>
          <div className="mb-4 shrink-0 flex items-center justify-between">
            <div className="flex items-end gap-4">
              <div className="w-64">
                <UserGroupAutocomplete
                  form={form}
                  name="userGroupId"
                  label="User Group"
                  // onChangeEvent removed
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
            className="flex-1 min-h-0"
            stickyColumnCount={2}
          />
        </form>
      </Form>
      <SaveConfirmation
        title="Save User Group Rights"
        itemName={`user group rights for ${selectedGroup?.userGroupName || "selected group"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
