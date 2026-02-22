// stores/permission-store.ts
import { IUserTransactionRights } from "@/interfaces/auth"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PermissionState {
  permissions: Record<string, IUserTransactionRights>
  setPermissions: (permissions: IUserTransactionRights[]) => void
  clearPermissions: () => void
  getPermissions: (
    moduleId: number,
    transactionId: number
  ) => IUserTransactionRights | undefined
  hasPermission: (
    moduleId: number,
    transactionId: number,
    action: keyof IUserTransactionRights
  ) => boolean
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: {},

      setPermissions: (permissions: IUserTransactionRights[]) =>
        set(() => {
          const newPermissions: Record<string, IUserTransactionRights> = {}

          // Check if permissions is an array before calling forEach
          if (Array.isArray(permissions)) {
            permissions.forEach((permission) => {
              const key = `${permission.moduleId}-${permission.transactionId}`
              newPermissions[key] = permission
            })
          } else {
            console.warn("setPermissions received non-array data:", permissions)
          }

          return {
            permissions: newPermissions,
          }
        }),

      clearPermissions: () => set({ permissions: {} }),

      getPermissions: (moduleId: number, transactionId: number) => {
        const key = `${moduleId}-${transactionId}`
        return get().permissions[key]
      },

      hasPermission: (
        moduleId: number,
        transactionId: number,
        action: keyof IUserTransactionRights
      ) => {
        const permission = get().getPermissions(moduleId, transactionId)
        return permission ? Boolean(permission[action]) : false
      },
    }),
    {
      name: "permission-storage",
    }
  )
)
