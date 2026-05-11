import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import type { IUserReportAccess } from "@/interfaces/admin"
import { getData } from "@/lib/api-client"
import { UserGroupReportRights } from "@/lib/api-routes"

export function normalizeReportFilePath(path: string): string {
  return path.replace(/\\/g, "/").trim().toLowerCase()
}

/**
 * Loose key so DB paths like `ar/AR Aging Summary` still match UI `ar/ArAgingSummary.trdp`
 * (AdmReports sometimes stores display-style names instead of real .trdp filenames).
 */
export function reportPathMatchKey(path: string): string {
  const normalized = path.replace(/\\/g, "/").trim()
  const last = normalized.split("/").pop() ?? normalized
  const withoutExt = last.replace(/\.trdp$/i, "")
  return withoutExt.replace(/[^a-z0-9]/gi, "").toLowerCase()
}

/**
 * Report .trdp paths the current user may list (group report right IsView), for a finance module (AR/AP/CB/GL).
 */
export function useViewableReportFiles(moduleId: number) {
  const query = useQuery({
    queryKey: ["myReportAccessRights", moduleId],
    queryFn: async () => {
      return await getData(`${UserGroupReportRights.getMyAccess}/${moduleId}`)
    },
    staleTime: 5 * 60 * 1000,
  })

  const viewablePaths = useMemo((): Set<string> | null => {
    if (query.isPending && !query.data) return null
    if (query.isError) return new Set<string>()
    const raw = query.data?.data as IUserReportAccess[] | undefined
    if (!Array.isArray(raw)) return new Set<string>()
    const keys = new Set<string>()
    for (const r of raw) {
      const p = r.reportFilePath
      if (!p || !String(p).trim()) continue
      keys.add(normalizeReportFilePath(p))
      keys.add(reportPathMatchKey(p))
    }
    return keys
  }, [query.isPending, query.isError, query.data])

  return {
    viewablePaths,
    isLoading: query.isPending && viewablePaths === null,
    isError: query.isError,
    refetch: query.refetch,
  }
}
