import {
  ICloneUserGroupRights,
  ICloneUserGroupReportRights,
  IResetPassword,
  IShareData,
  IUser,
  IUserGroup,
  IUserGroupRights,
  IUserGroupReportRights,
  IUserRights,
  IUserRightsv1,
} from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { IDocType, IDocument } from "@/interfaces/lookup"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { AxiosError } from "axios"

import { apiClient, getData, saveData } from "@/lib/api-client"
import {
  Admin,
  DocumentType,
  ShareData,
  User,
  UserGroup,
  UserGroupRights,
  UserGroupReportRights,
  UserRights,
} from "@/lib/api-routes"

/**
 * 1. User Management Hooks
 * ------------------------
 * 1.1 Get Users
 * @param {number} page - The current page number
 * @param {number} limit - Number of users per page
 * @param {string} search - Search string for filtering users
 * @returns {object} Query object containing user data
 */
export const useGetuser = (page: number, limit: number, search: string) => {
  return useQuery<ApiResponse<IUser[]>>({
    queryKey: ["user", page, limit, search],
    queryFn: async () => {
      const params = {
        searchString: search ? search : " ",
        pageNumber: (page + 1).toString(),
        pageSize: limit.toString(),
      }
      return await getData(User.get, params)
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * 1.2 Save User
 * @param {object} userData - User data to save
 * @returns {object} Mutation object for saving user
 */
export const useSaveUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ data }: { data: IUser }) => {
      return await saveData(User.add, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * 1.3 Update User
 * @param {object} userData - User data to update
 * @returns {object} Mutation object for updating user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IUser) => {
      return await saveData(User.add, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * 1.4 Delete User
 * @param {number} userId - ID of user to delete
 * @returns {object} Mutation object for deleting user
 */
export const useDeleteuser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiClient.delete(`${User.delete}/${id}`)
      return response.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * 1.5 Reset Password
 * @param {object} data - Password reset data
 * @returns {object} Mutation object for password reset
 */
export const useResetPasswordV1 = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IResetPassword) => {
      return await saveData(`${User.resetPassword}`, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * 1.6 Update User Rights
 * @param {object} data - User rights data
 * @returns {object} Mutation object for updating user rights
 */
export const useUpdateUserRights = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IUserRights[]) => {
      return await saveData(UserRights.add, data)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["UserRights"] }),
  })
}

/**
 * 2. User Group Rights Management
 * ------------------------------
 * 2.1 Get User Group Rights by ID
 * @param {number} userGroupId - ID of user group
 * @returns {object} Query object containing user group rights
 */
export const useUserGroupRightbyidGet = (userGroupId: number) => {
  return useQuery({
    queryKey: ["usergroupright", userGroupId],
    placeholderData: keepPreviousData,
    staleTime: 600000,
    queryFn: async () => {
      return await getData(`${UserGroupRights.get}/${userGroupId}`)
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * 2.2 Save User Group Rights
 * @param {object} data - User group rights data
 * @returns {object} Mutation object for saving user group rights
 */
export const useUserGroupRightSave = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: IUserGroupRights[] }) => {
      try {
        return await saveData(UserGroupRights.add, data)
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error saving user group rights:", error)
          throw error.response?.data || "Error saving user group rights."
        }
        throw new Error("An unexpected error occurred")
      }
    },
  })
}

/**
 * 3. Share Data Management
 * ----------------------
 * 3.1 Get Share Data
 * @returns {object} Query object containing share data
 */
export const useShareDataGet = () => {
  return useQuery({
    queryKey: ["shareData"],
    placeholderData: keepPreviousData,
    staleTime: 600000,
    queryFn: async () => {
      return await getData(ShareData.get)
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * 3.2 Save Share Data
 * @param {object} data - Share data to save
 * @returns {object} Mutation object for saving share data
 */
export const useShareDataSave = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: IShareData[] }) => {
      try {
        const response = await apiClient.post(`${ShareData.add}`, data)
        return response.data
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error saving share data:", error)
          throw error.response?.data || "Error saving share data."
        }
        throw new Error("An unexpected error occurred")
      }
    },
  })
}

/**
 * 4. User Rights Management
 * ------------------------
 * 4.1 Get User Rights by ID
 * @param {number} userId - ID of user
 * @returns {object} Query object containing user rights
 */
export const useUserRightbyidGet = (userId: number) => {
  return useQuery({
    queryKey: ["userright", userId],
    queryFn: async () => {
      return apiClient
        .get(`${UserRights.get}/${userId}`)
        .then((response) => response.data)
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    staleTime: 600000,
    enabled: userId > 0,
  })
}

/**
 * 4.2 Get User Rights
 * @param {number} id - ID of user
 * @returns {object} Query object containing user rights
 */
export const useGetUserRights = (id: number) => {
  return useQuery<ApiResponse<IUserRights[]>>({
    queryKey: ["UserRights", id],
    queryFn: async () => {
      return apiClient
        .get(`${UserRights.get}/${id}`)
        .then((response) => response.data)
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * 4.3 Save User Rights
 * @param {object} data - User rights data
 * @returns {object} Mutation object for saving user rights
 */
export const useUserRightSave = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: IUserRights[] }) => {
      try {
        const response = await apiClient.post(`${UserRights.add}`, data)
        return response.data
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error saving user rights:", error)
          throw error.response?.data || "Error saving user rights."
        }
        throw new Error("An unexpected error occurred")
      }
    },
  })
}

export const useUserRightbyidGetV1 = (userId: number) => {
  return useQuery({
    queryKey: ["userright", userId],
    placeholderData: keepPreviousData,
    staleTime: 600000,
    queryFn: async () => {
      return apiClient
        .get(`${UserRights.getV1}/${userId}`)
        .then((response) => response.data)
    },
    refetchOnWindowFocus: false,
  })
}

export const useUserRightSaveV1 = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: IUserRightsv1[] }) => {
      try {
        const response = await apiClient.post(`${UserRights.addV1}`, data)
        return response.data
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error saving user rights:", error)
          throw error.response?.data || "Error saving user rights."
        }
        throw new Error("An unexpected error occurred")
      }
    },
  })
}

/**
 * 5. User Group Management
 * ----------------------
 * 5.1 Get User Groups
 * @param {number} page - Current page number
 * @param {number} limit - Number of groups per page
 * @param {string} search - Search string for filtering groups
 * @returns {object} Query object containing user groups
 */
export const useGetUserGroup = (
  page: number,
  limit: number,
  search: string
) => {
  return useQuery<ApiResponse<IUserGroup[]>>({
    queryKey: ["UserGroup", page, limit, search],
    queryFn: async () => {
      const params = {
        searchString: search ? search : " ",
        pageNumber: (page + 1).toString(),
        pageSize: limit.toString(),
      }
      return await getData(UserGroup.get, params)
    },
    refetchOnWindowFocus: false,
  })
}

/**
 * 5.2 Save User Group
 * @param {object} data - User group data
 * @returns {object} Mutation object for saving user group
 */
export const useSaveUserGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ data }: { data: IUserGroup }) => {
      return apiClient.post(UserGroup.add, data).then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userGroup"] }),
  })
}

/**
 * 5.3 Update User Group
 * @param {object} data - User group data
 * @returns {object} Mutation object for updating user group
 */
export const useUpdateUserGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IUserGroup) => {
      return apiClient.post(UserGroup.add, data).then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userGroup"] }),
  })
}

/**
 * 5.4 Delete User Group
 * @param {number} id - ID of user group to delete
 * @returns {object} Mutation object for deleting user group
 */
export const useDeleteUserGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return apiClient
        .delete(`${UserGroup.delete}/${id}`) //for UserGroup update need to add UserGroupid pathvariable  & have doubt wht we send in headers
        .then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["UserGroup"] }),
  })
}

/**
 * 6. Document Management
 * --------------------
 * 6.1 Get Documents
 * @param {string} documentId - ID of document
 * @param {object} result - Result object containing module and transaction IDs
 * @returns {object} Query object containing documents
 */
export const useGetDocuments = (
  documentId: string,
  result: { moduleId: number; transactionId: number }
) => {
  return useQuery<ApiResponse<IDocType[]>>({
    queryKey: [
      "documents",
      documentId,
      result?.moduleId,
      result?.transactionId,
    ],
    queryFn: async () => {
      return apiClient
        .get(
          `${DocumentType.get}/${result?.moduleId}/${result?.transactionId}/${documentId}`
        )
        .then((response) => response.data)
    },
    enabled: !!documentId && !!result,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

/**
 * 6.2 Save Document
 * @param {object} data - Document data
 * @returns {object} Mutation object for saving document
 */
export const useSaveDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ data }: { data: IDocument | IDocument[] }) => {
      // Backend expects List<SaveDocumentViewModel>, so wrap single object in array
      const payload = Array.isArray(data) ? data : [data]
      return apiClient
        .post(`${Admin.saveDocument}`, payload)
        .then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * 6.3 Get Document Type
 * @param {number} moduleId - ID of module
 * @param {number} transactionId - ID of transaction
 * @param {string} documentId - ID of document
 * @param {object} options - Additional query options
 * @returns {object} Query object containing document type
 */
export function useGetDocumentType<T>(
  moduleId: number,
  transactionId: number,
  documentId: string,
  options = {}
) {
  return useQuery<ApiResponse<T>>({
    queryKey: ["documentType", moduleId, transactionId, documentId],
    queryFn: async () => {
      // Clean up the URL by removing any double slashes
      const response = await apiClient.get<ApiResponse<T>>(
        `${Admin.getDocumentById}/${moduleId}/${transactionId}/${documentId}`
      )
      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * 8. User Group Rights Cloning
 * --------------------------
 * 8.1 Clone User Group Rights
 * @param {object} data - Cloning data containing source and target group IDs
 * @returns {object} Mutation object for cloning user group rights
 */
export const useCloneUserGroupRightsSave = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ICloneUserGroupRights) => {
      return apiClient
        .post(
          `${UserGroupRights.clone}/${data.fromUserGroupId}/${data.toUserGroupId}`,
          data
        )
        .then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}

/**
 * User Group Report Rights
 * -----------------------
 */
export const useUserGroupReportRightbyidGet = (userGroupId: number) => {
  return useQuery({
    queryKey: ["usergroupreportright", userGroupId],
    placeholderData: keepPreviousData,
    staleTime: 600000,
    queryFn: async () => {
      return await getData(`${UserGroupReportRights.get}/${userGroupId}`)
    },
    refetchOnWindowFocus: false,
  })
}

export const useUserGroupReportRightSave = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: IUserGroupReportRights[] }) => {
      try {
        return await saveData(UserGroupReportRights.add, data)
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error saving user group report rights:", error)
          throw error.response?.data || "Error saving user group report rights."
        }
        throw new Error("An unexpected error occurred")
      }
    },
  })
}

export const useCloneUserGroupReportRightsSave = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ICloneUserGroupReportRights) => {
      return apiClient
        .post(
          `${UserGroupReportRights.clone}/${data.fromUserGroupId}/${data.toUserGroupId}`,
          data
        )
        .then((res) => res.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  })
}
