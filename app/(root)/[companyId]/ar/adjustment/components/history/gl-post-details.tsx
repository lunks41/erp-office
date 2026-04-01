import { ApiResponse } from "@/interfaces/auth"
import { IGlTransactionDetails } from "@/interfaces/history"
import { useAuthStore } from "@/stores/auth-store"

import { clientDateFormat } from "@/lib/date-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetGlPostDetails } from "@/hooks/use-histoy"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGlPostDetailsColumns } from "@/components/gl-post-details-columns"
import { BasicTable } from "@/components/table/table-basic"
import {
  HISTORY_EMBEDDED_PAGE_SIZE,
  HISTORY_EMBEDDED_TABLE_MAX_HEIGHT,
} from "@/components/table/history-embedded-presets"


interface GLPostDetailsProps {
  adjustmentId: string
}

export default function GLPostDetails({ adjustmentId }: GLPostDetailsProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.adjustment

  const { data: glPostDetails, refetch: refetchGlPost } =
    //useGetGlPostDetails<IGlTransactionDetails>(25, 1, "14120250100024")
    useGetGlPostDetails<IGlTransactionDetails>(
      Number(moduleId),
      Number(transactionId),
      adjustmentId
    )

  const { data: glPostDetailsData } =
    (glPostDetails as ApiResponse<IGlTransactionDetails>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // const {
  //   result: glPostDetailsResult,
  //   message: glPostDetailsMessage,
  //   data: glPostDetailsData,
  // } = glPostDetails ?? {}

  const columns = getGlPostDetailsColumns(
    amtDec,
    locAmtDec,
    exhRateDec,
    dateFormat
  )

  const handleRefresh = async () => {
    try {
      await refetchGlPost()
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GL Post Details</CardTitle>
      </CardHeader>
      <CardContent>
        <BasicTable
          data={glPostDetailsData || []}
          columns={columns}
          isLoading={false}
          moduleId={moduleId}
          transactionId={transactionId}
          tableName={TableName.glPostDetails}
          emptyMessage="No results."
          onRefreshAction={handleRefresh}
          showHeader={true}
          showFooter={false}
          maxHeight={HISTORY_EMBEDDED_TABLE_MAX_HEIGHT}
          pageSizeOption={HISTORY_EMBEDDED_PAGE_SIZE}
        />
      </CardContent>
    </Card>
  )
}
