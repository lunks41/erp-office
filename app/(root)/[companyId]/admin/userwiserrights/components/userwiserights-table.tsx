"use client"

import { useEffect, useState } from "react"
import { IUserRightsv1 } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { IUserLookup } from "@/interfaces/lookup"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useUserRightSaveV1, useUserRightbyidGetV1 } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { UserAutocomplete } from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { SettingTable } from "@/components/table/table-setting"

type PermissionType =
  | "isRead"
  | "isCreate"
  | "isEdit"
  | "isDelete"
  | "isExport"
  | "isPrint"
  | "isPost"

export function UserWiseSettingTable() {
  const form = useForm()
  const [selectedUser, setSelectedUser] = useState<IUserLookup | null>(null)
  const [userRights, setUserRights] = useState<IUserRightsv1[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Fetch user rights for selected user
  const {
    data: userRightsResponse,
    refetch: refetchUserRights,
    isFetching: isRightsLoading,
  } = useUserRightbyidGetV1(selectedUser?.userId || 0)

  // Save user rights mutation
  const userRightSave = useUserRightSaveV1()

  // Update userRights when userRightsResponse changes
  useEffect(() => {
    if (userRightsResponse) {
      const response = userRightsResponse as ApiResponse<IUserRightsv1>

      if (response.data && Array.isArray(response.data)) {
        setUserRights(response.data)
      } else {
        setUserRights([])
      }
    } else {
      setUserRights([])
    }
  }, [userRightsResponse])

  // When group changes, refetch rights
  useEffect(() => {
    if (selectedUser?.userId) {
      refetchUserRights()
    } else {
      setUserRights([])
    }
  }, [selectedUser?.userId, refetchUserRights])

  // Handle permission change for a specific right
  const handlePermissionChange = (
    moduleId: number,
    transactionId: number,
    permission: PermissionType,
    checked: boolean
  ) => {
    setUserRights((prev) =>
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
    setUserRights((prev) =>
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
    setUserRights((prev) =>
      prev.map((right) => ({
        ...right,
        [permission]: checked,
      }))
    )
  }

  // Check if all permissions in a row are selected
  const isRowAllSelected = (right: IUserRightsv1) => {
    return (
      right.isRead &&
      right.isCreate &&
      right.isEdit &&
      right.isDelete &&
      right.isExport &&
      right.isPrint &&
      right.isPost
    )
  }

  // Check if all permissions in a column are selected
  const isColumnAllSelected = (permission: PermissionType) => {
    return (
      userRights.length > 0 && userRights.every((right) => right[permission])
    )
  }

  // Define columns for the table
  const columns: ColumnDef<IUserRightsv1>[] = [
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
              userRights.length > 0 && userRights.every(isRowAllSelected)
            }
            onCheckedChange={(checked) => {
              const isChecked = Boolean(checked)
              setUserRights((prev) =>
                prev.map((right) => ({
                  ...right,
                  isRead: isChecked,
                  isCreate: isChecked,
                  isEdit: isChecked,
                  isDelete: isChecked,
                  isExport: isChecked,
                  isPrint: isChecked,
                  isPost: isChecked,
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
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
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
    {
      id: "isPost",
      header: () => (
        <div className="flex items-center gap-2">
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
  ]

  // Handle save button click
  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first")
      return
    }
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first")
      return
    }

    try {
      setSaving(true)
      const rightsToSave = userRights.map((right) => ({
        ...right,
        userId: selectedUser.userId,
      }))

      const response = await userRightSave.mutateAsync({
        data: rightsToSave,
      })

      if (response.result === 1) {
        toast.success("User group rights saved successfully")
        refetchUserRights()
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
    if (!selectedUser) {
      setUserRights([])
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
            data={userRights}
            columns={columns}
            isLoading={isRightsLoading}
            emptyMessage="No data. Please select a user."
            maxHeight="460px"
          />
        </form>
      </Form>
      <SaveConfirmation
        title="Save User Wise Rights"
        itemName={`user wise rights for ${selectedUser?.userName || "selected user"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
