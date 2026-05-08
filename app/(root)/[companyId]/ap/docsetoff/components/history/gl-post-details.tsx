import { IGlTransactionDetails } from "@/interfaces/history"
import { clientDateFormat } from "@/lib/date-utils"
import { APTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import { useGetGlPostDetails } from "@/hooks/use-histoy"
import { getGlPostDetailsColumns } from "@/components/gl-post-details-columns"
import { BasicTable } from "@/components/table/table-basic"
import {
  HISTORY_EMBEDDED_PAGE_SIZE,
  HISTORY_EMBEDDED_TABLE_MAX_HEIGHT,
  HISTORY_SECTION_CONTENT_CLASS,
  HISTORY_SECTION_HEADER_CLASS,
  HISTORY_SECTION_TITLE_CLASS,
} from "@/components/table/history-embedded-presets"


import { useCompanyStore } from "@/stores/company-store"
interface GLPostDetailsProps {
  setoffId: string
}

export default function GLPostDetails({ setoffId }: GLPostDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.docsetoff

  const { data: glPostDetails, refetch: refetchGlPost } =
    //useGetGlPostDetails<IGlTransactionDetails>(25, 1, "14120250100024")
    useGetGlPostDetails<IGlTransactionDetails>(
      Number(moduleId),
      Number(transactionId),
      setoffId
    )

  const glPostDetailsData = glPostDetails?.data ?? []

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
    <div>
      <div className={HISTORY_SECTION_HEADER_CLASS}>
        <p className={HISTORY_SECTION_TITLE_CLASS}>GL Post Details</p>
      </div>
      <div className={HISTORY_SECTION_CONTENT_CLASS}>
        <BasicTable
          data={glPostDetailsData}
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
          pageSizeOption={
            glPostDetailsData.length || HISTORY_EMBEDDED_PAGE_SIZE
          }
        />
      </div>
    </div>
  )
}
