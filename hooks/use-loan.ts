import { useCallback, useState } from "react"
import {
  ILoan,
  ILoanApplication,
  ILoanApplicationFilter,
  ILoanApplicationFormData,
  ILoanApprovalFormData,
  ILoanDashboard,
  ILoanFilter,
  ILoanRepayment,
  ILoanRepaymentFilter,
  ILoanRepaymentFormData,
} from "@/interfaces/loan"
import { useAuthStore } from "@/stores/auth-store"
import { deleteData, getData, postData, updateData } from "@/lib/api-client"

// API Routes (you would define these in api-routes.ts)
import { useCompanyStore } from "@/stores/company-store"
const LoanRoutes = {
  // Applications
  getApplications: "/api/loan/applications",
  getApplicationById: "/api/loan/applications",
  createApplication: "/api/loan/applications",
  updateApplication: "/api/loan/applications",
  deleteApplication: "/api/loan/applications",

  // Approvals
  getApprovals: "/api/loan/approvals",
  createApproval: "/api/loan/approvals",

  // Loans
  getLoans: "/api/loan/loans",
  getLoanById: "/api/loan/loans",
  createLoan: "/api/loan/loans",
  updateLoan: "/api/loan/loans",

  // Repayments
  getRepayments: "/api/loan/repayments",
  createRepayment: "/api/loan/repayments",

  // Dashboard
  getDashboard: "/api/loan/dashboard",
}

interface UseLoanReturn {
  // State
  applications: ILoanApplication[]
  loans: ILoan[]
  repayments: ILoanRepayment[]
  dashboard: ILoanDashboard | null
  isLoading: boolean
  error: string | null

  // Application actions
  fetchApplications: (filters?: ILoanApplicationFilter) => Promise<void>
  fetchApplicationById: (
    applicationId: number
  ) => Promise<ILoanApplication | null>
  createApplication: (data: ILoanApplicationFormData) => Promise<boolean>
  updateApplication: (
    applicationId: number,
    data: Partial<ILoanApplicationFormData>
  ) => Promise<boolean>
  deleteApplication: (applicationId: number) => Promise<boolean>
  submitApplication: (applicationId: number) => Promise<boolean>

  // Approval actions
  fetchApprovals: () => Promise<void>
  createApproval: (data: ILoanApprovalFormData) => Promise<boolean>

  // Loan actions
  fetchLoans: (filters?: ILoanFilter) => Promise<void>
  fetchLoanById: (loanId: number) => Promise<ILoan | null>
  createLoan: (data: Partial<ILoan>) => Promise<boolean>
  updateLoan: (loanId: number, data: Partial<ILoan>) => Promise<boolean>

  // Repayment actions
  fetchRepayments: (filters?: ILoanRepaymentFilter) => Promise<void>
  createRepayment: (data: ILoanRepaymentFormData) => Promise<boolean>

  // Dashboard
  fetchDashboard: () => Promise<void>

  // Utilities
  clearError: () => void
}

export const useLoan = (): UseLoanReturn => {
  const { token, user } = useAuthStore()
  const { currentCompany } = useCompanyStore()
  const [applications, setApplications] = useState<ILoanApplication[]>([])
  const [loans, setLoans] = useState<ILoan[]>([])
  const [repayments, setRepayments] = useState<ILoanRepayment[]>([])
  const [dashboard, setDashboard] = useState<ILoanDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Fetch loan applications
  const fetchApplications = useCallback(
    async (filters?: ILoanApplicationFilter) => {
      if (!token || !user || !currentCompany) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value.toString())
            }
          })
        }

        const response = await getData(
          LoanRoutes.getApplications,
          Object.fromEntries(params)
        )

        if (response.result === 1) {
          setApplications(response.data || [])
        } else {
          setError(response.message || "Failed to fetch applications")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany]
  )

  // Fetch application by ID
  const fetchApplicationById = useCallback(
    async (applicationId: number): Promise<ILoanApplication | null> => {
      if (!token || !user || !currentCompany) return null

      setIsLoading(true)
      setError(null)

      try {
        const response = await getData(
          `${LoanRoutes.getApplicationById}/${applicationId}`
        )

        if (response.result === 1) {
          return response.data
        } else {
          setError(response.message || "Failed to fetch application")
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany]
  )

  // Create new application
  const createApplication = useCallback(
    async (data: ILoanApplicationFormData): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await postData(LoanRoutes.createApplication, data)

        if (response.result === 1) {
          // Refresh applications list
          await fetchApplications()
          return true
        } else {
          setError(response.message || "Failed to create application")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchApplications]
  )

  // Update application
  const updateApplication = useCallback(
    async (
      applicationId: number,
      data: Partial<ILoanApplicationFormData>
    ): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await updateData(
          `${LoanRoutes.updateApplication}/${applicationId}`,
          data
        )

        if (response.result === 1) {
          // Refresh applications list
          await fetchApplications()
          return true
        } else {
          setError(response.message || "Failed to update application")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchApplications]
  )

  // Delete application
  const deleteApplication = useCallback(
    async (applicationId: number): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await deleteData(
          `${LoanRoutes.deleteApplication}/${applicationId}`
        )

        if (response.result === 1) {
          // Refresh applications list
          await fetchApplications()
          return true
        } else {
          setError(response.message || "Failed to delete application")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchApplications]
  )

  // Submit application
  const submitApplication = useCallback(
    async (applicationId: number): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await updateData(
          `${LoanRoutes.updateApplication}/${applicationId}`,
          {
            status: "Submitted",
            submittedDate: new Date(),
          }
        )

        if (response.result === 1) {
          // Refresh applications list
          await fetchApplications()
          return true
        } else {
          setError(response.message || "Failed to submit application")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchApplications]
  )

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    if (!token || !user || !currentCompany) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getData(LoanRoutes.getApprovals)

      if (response.result === 1) {
        // Handle approvals data if needed
      } else {
        setError(response.message || "Failed to fetch approvals")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [token, user, currentCompany])

  // Fetch loans
  const fetchLoans = useCallback(
    async (filters?: ILoanFilter) => {
      if (!token || !user || !currentCompany) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value.toString())
            }
          })
        }

        const response = await getData(
          LoanRoutes.getLoans,
          Object.fromEntries(params)
        )

        if (response.result === 1) {
          setLoans(response.data || [])
        } else {
          setError(response.message || "Failed to fetch loans")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany]
  )

  // Create approval
  const createApproval = useCallback(
    async (data: ILoanApprovalFormData): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await postData(LoanRoutes.createApproval, data)

        if (response.result === 1) {
          // Refresh applications and loans lists
          await fetchApplications()
          await fetchLoans()
          return true
        } else {
          setError(response.message || "Failed to create approval")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchApplications, fetchLoans]
  )

  // Fetch loan by ID
  const fetchLoanById = useCallback(
    async (loanId: number): Promise<ILoan | null> => {
      if (!token || !user || !currentCompany) return null

      setIsLoading(true)
      setError(null)

      try {
        const response = await getData(`${LoanRoutes.getLoanById}/${loanId}`)

        if (response.result === 1) {
          return response.data
        } else {
          setError(response.message || "Failed to fetch loan")
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany]
  )

  // Create loan
  const createLoan = useCallback(
    async (data: Partial<ILoan>): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await postData(LoanRoutes.createLoan, data)

        if (response.result === 1) {
          // Refresh loans list
          await fetchLoans()
          return true
        } else {
          setError(response.message || "Failed to create loan")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchLoans]
  )

  // Update loan
  const updateLoan = useCallback(
    async (loanId: number, data: Partial<ILoan>): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await updateData(
          `${LoanRoutes.updateLoan}/${loanId}`,
          data
        )

        if (response.result === 1) {
          // Refresh loans list
          await fetchLoans()
          return true
        } else {
          setError(response.message || "Failed to update loan")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchLoans]
  )

  // Fetch repayments
  const fetchRepayments = useCallback(
    async (filters?: ILoanRepaymentFilter) => {
      if (!token || !user || !currentCompany) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value.toString())
            }
          })
        }

        const response = await getData(
          LoanRoutes.getRepayments,
          Object.fromEntries(params)
        )

        if (response.result === 1) {
          setRepayments(response.data || [])
        } else {
          setError(response.message || "Failed to fetch repayments")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany]
  )

  // Create repayment
  const createRepayment = useCallback(
    async (data: ILoanRepaymentFormData): Promise<boolean> => {
      if (!token || !user || !currentCompany) return false

      setIsLoading(true)
      setError(null)

      try {
        const response = await postData(LoanRoutes.createRepayment, data)

        if (response.result === 1) {
          // Refresh repayments list
          await fetchRepayments()
          return true
        } else {
          setError(response.message || "Failed to create repayment")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [token, user, currentCompany, fetchRepayments]
  )

  // Fetch dashboard
  const fetchDashboard = useCallback(async () => {
    if (!token || !user || !currentCompany) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getData(LoanRoutes.getDashboard)

      if (response.result === 1) {
        setDashboard(response.data)
      } else {
        setError(response.message || "Failed to fetch dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [token, user, currentCompany])

  return {
    // State
    applications,
    loans,
    repayments,
    dashboard,
    isLoading,
    error,

    // Application actions
    fetchApplications,
    fetchApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    submitApplication,

    // Approval actions
    fetchApprovals,
    createApproval,

    // Loan actions
    fetchLoans,
    fetchLoanById,
    createLoan,
    updateLoan,

    // Repayment actions
    fetchRepayments,
    createRepayment,

    // Dashboard
    fetchDashboard,

    // Utilities
    clearError,
  }
}
