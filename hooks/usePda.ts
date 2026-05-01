import { IPdaFilter, IPdaHd } from "@/interfaces/IPda"
import { ApiResponse, IApiSuccessResponse } from "@/interfaces/auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { deleteData, getById, getData, saveData } from "@/lib/api-client"
import { Pda } from "@/lib/api-routes"

const toQueryParams = (
  filter: IPdaFilter | undefined
): Record<string, string> | undefined => {
  if (!filter) return undefined
  const params: Record<string, string> = {}
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = String(value)
    }
  })
  return params
}

export function usePdaList(filter: IPdaFilter) {
  return useQuery<ApiResponse<IPdaHd>>({
    queryKey: ["pda-list", filter],
    queryFn: async () => getData(Pda.list, toQueryParams(filter)),
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  })
}

export function usePdaById(pdaId: number) {
  return useQuery<IApiSuccessResponse<IPdaHd>>({
    queryKey: ["pda-by-id", pdaId],
    queryFn: async () => getById(`${Pda.byId}/${pdaId}`),
    enabled: pdaId > 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreatePda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      saveData(Pda.create, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pda-list"] })
    },
  })
}

export function useUpdatePda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      saveData(Pda.update, payload),
    onSuccess: (_response, variables) => {
      const pdaId = Number((variables as { pdaId?: number }).pdaId || 0)
      queryClient.invalidateQueries({ queryKey: ["pda-list"] })
      if (pdaId > 0) {
        queryClient.invalidateQueries({
          queryKey: ["pda-by-id", pdaId],
        })
      }
    },
  })
}

export function useDeletePda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { companyId: number; pdaId: number }) =>
      deleteData(
        `${Pda.delete}?companyId=${payload.companyId}&pdaId=${payload.pdaId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pda-list"] })
    },
  })
}

export function useApprovePda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { companyId: number; pdaId: number }) =>
      saveData(Pda.approve, payload),
    onSuccess: (_response, payload) => {
      queryClient.invalidateQueries({ queryKey: ["pda-list"] })
      queryClient.invalidateQueries({
        queryKey: ["pda-by-id", payload.pdaId],
      })
    },
  })
}

export function useClonePda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { companyId: number; pdaId: number }) =>
      saveData(Pda.clone, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pda-list"] })
    },
  })
}
