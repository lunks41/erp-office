import { create } from "zustand"

export interface DocumentExpiryListFilters {
  search: string
  statusId: number | null
  categoryId: number | null
  typeId: number | null
  page: number
  pageSize: number
}

interface DocumentExpiryState {
  filters: DocumentExpiryListFilters
  setSearch: (search: string) => void
  setStatusId: (statusId: number | null) => void
  setCategoryId: (categoryId: number | null) => void
  setTypeId: (typeId: number | null) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  resetFilters: () => void
}

const defaultFilters: DocumentExpiryListFilters = {
  search: "",
  statusId: null,
  categoryId: null,
  typeId: null,
  page: 1,
  pageSize: 20,
}

export const useDocumentExpiryStore = create<DocumentExpiryState>((set) => ({
  filters: { ...defaultFilters },
  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search, page: 1 } })),
  setStatusId: (statusId) =>
    set((s) => ({ filters: { ...s.filters, statusId, page: 1 } })),
  setCategoryId: (categoryId) =>
    set((s) => ({ filters: { ...s.filters, categoryId, page: 1 } })),
  setTypeId: (typeId) =>
    set((s) => ({ filters: { ...s.filters, typeId, page: 1 } })),
  setPage: (page) => set((s) => ({ filters: { ...s.filters, page } })),
  setPageSize: (pageSize) =>
    set((s) => ({ filters: { ...s.filters, pageSize, page: 1 } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
