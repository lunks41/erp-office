// stores/permission-store.ts
import { IUserTransactionRights } from "@/interfaces/auth"
import { create } from "zustand"

interface PermissionState {
  permissions: Record<string, IUserTransactionRights>
  setPermissions: (permissions: IUserTransactionRights[]) => void
  clearPermissions: () => void
  getPermissions: (
    moduleId: number,
    transactionId: number
  ) => IUserTransactionRights | undefined
  getPermissionByTransactionCode: (
    moduleCode: string,
    transactionCode: string
  ) => IUserTransactionRights | undefined
  hasPermission: (
    moduleId: number,
    transactionId: number,
    action: keyof IUserTransactionRights
  ) => boolean
}

export const usePermissionStore = create<PermissionState>()((set, get) => ({
  permissions: {},

  setPermissions: (permissions: IUserTransactionRights[]) =>
    set(() => {
      const newPermissions: Record<string, IUserTransactionRights> = {}

      if (Array.isArray(permissions)) {
        permissions.forEach((permission) => {
          const key = `${permission.moduleId}-${permission.transactionId}`
          newPermissions[key] = permission
        })
      } else {
        console.warn("setPermissions received non-array data:", permissions)
      }

      return { permissions: newPermissions }
    }),

  clearPermissions: () => set({ permissions: {} }),

  getPermissions: (moduleId: number, transactionId: number) => {
    const key = `${moduleId}-${transactionId}`
    return get().permissions[key]
  },

  getPermissionByTransactionCode: (moduleCode: string, transactionCode: string) => {
    const normalize = (s: string) => s.toLowerCase().replace(/-/g, "")
    const mc = normalize(moduleCode)
    const tc = normalize(transactionCode)
    return Object.values(get().permissions).find(
      (p) => normalize(p.moduleCode) === mc && normalize(p.transactionCode) === tc
    )
  },

  hasPermission: (
    moduleId: number,
    transactionId: number,
    action: keyof IUserTransactionRights
  ) => {
    const permission = get().getPermissions(moduleId, transactionId)
    return permission ? Boolean(permission[action]) : false
  },
}))
