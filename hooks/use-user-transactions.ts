"use client"

import * as React from "react"

import { useCompanyStore } from "@/stores/company-store"
import { useAuthStore } from "@/stores/auth-store"

export interface IUserTransaction {
  moduleId: number
  moduleCode: string
  moduleName: string
  transactionId: number
  transactionCode: string
  transactionName: string
  transCategoryId: number
  transCategoryCode: string
  transCategoryName: string
  seqNo: number
  transCatSeqNo: number
  isRead: boolean
  isCreate: boolean
  isEdit: boolean
  isDelete: boolean
  isExport: boolean
  isPrint: boolean
  isPost: boolean
  isVisible: boolean
}

export const useUserTransactions = () => {
  const user = useAuthStore((s) => s.user)
  const getUserTransactions = useAuthStore((s) => s.getUserTransactions)
  const currentCompany = useCompanyStore((s) => s.currentCompany)
  const [transactions, setTransactions] = React.useState<IUserTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentCompany || !user) {
        setIsLoading(false)
        setTransactions([])
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const data = await getUserTransactions()
        if (Array.isArray(data)) {
          setTransactions(data as IUserTransaction[])
        } else {
          setTransactions([])
        }
      } catch {
        setError("Failed to fetch transactions")
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [currentCompany, user, getUserTransactions])

  return { transactions, isLoading, error }
}
