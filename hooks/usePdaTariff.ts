import { IPdaDt, IPdaTariffLoadRequest } from "@/interfaces/IPda"
import { IApiSuccessResponse } from "@/interfaces/auth"
import { useQuery } from "@tanstack/react-query"

import { getData } from "@/lib/api-client"
import { Pda } from "@/lib/api-routes"

export function useLoadTariffLines(
  req: IPdaTariffLoadRequest,
  enabled: boolean = false
) {
  return useQuery<IApiSuccessResponse<IPdaDt[]>>({
    queryKey: ["pda-tariff-load", req],
    queryFn: async () =>
      getData(Pda.loadFromTariff, {
        companyId: String(req.companyId),
        customerId: String(req.customerId),
        portId: String(req.portId),
        taskId: String(req.taskId),
        jobOrderId: String(req.jobOrderId),
      }),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  })
}
