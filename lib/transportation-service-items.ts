type TransportationDetailLike = {
  serviceItemNo?: number | string
  serviceItemNoName?: string
}

/**
 * Labels for the Transportation "Services" column.
 *
 * List API aggregates multiple detail rows as:
 *   ServiceItemNo     -> "123,456"        (comma, no space)
 *   ServiceItemNoName -> "Name1, Name2"   (comma + space between items)
 *
 * A single service item name may itself contain commas (e.g. consignment /
 * equipment descriptions). Never split the name on every comma — use the
 * service-item id count instead.
 */
export function getTransportationServiceItemLabels(
  serviceItemNo: string,
  serviceItemNoName?: string,
  dataDetails?: TransportationDetailLike[]
): string[] {
  if (dataDetails && dataDetails.length > 0) {
    return dataDetails
      .map((detail) => {
        const name = detail.serviceItemNoName?.trim()
        if (name) return name
        const id = detail.serviceItemNo
        return id != null && String(id).trim() !== "" ? String(id) : ""
      })
      .filter((label) => label.length > 0)
  }

  const ids = serviceItemNo
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  const name = (serviceItemNoName ?? "").trim()

  if (ids.length === 0 && !name) return []

  // One service item — keep the full display name (internal commas stay intact).
  if (ids.length <= 1) {
    if (name) return [name]
    return ids.length > 0 ? [ids[0]] : []
  }

  // Multiple service items — API joins display names with ", ".
  const nameParts = name
    ? name.split(", ").map((part) => part.trim()).filter(Boolean)
    : []

  if (nameParts.length === ids.length) {
    return nameParts
  }

  return ids.map((id, index) => nameParts[index] || id)
}

/** Parse API/header service item ids into detail rows for save + validation. */
export function buildTransportationDetailsFromServiceItemNos(
  serviceItemNo: string,
  serviceItemNoName?: string,
  existingDetails?: TransportationDetailLike[]
): Array<{
  itemNo: number
  serviceItemNo: number
  serviceItemNoName: string
}> {
  if (existingDetails && existingDetails.length > 0) {
    return existingDetails
      .map((detail, index) => {
        const id = Number(detail.serviceItemNo)
        if (!Number.isFinite(id) || id <= 0) return null
        return {
          itemNo: Number(detail.itemNo) > 0 ? Number(detail.itemNo) : index + 1,
          serviceItemNo: id,
          serviceItemNoName: detail.serviceItemNoName?.trim() ?? "",
        }
      })
      .filter(
        (
          row
        ): row is {
          itemNo: number
          serviceItemNo: number
          serviceItemNoName: string
        } => row !== null
      )
  }

  const ids = serviceItemNo
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (ids.length === 0) return []

  const labels = getTransportationServiceItemLabels(
    serviceItemNo,
    serviceItemNoName
  )

  return ids.map((id, index) => ({
    itemNo: index + 1,
    serviceItemNo: id,
    serviceItemNoName: labels[index] ?? "",
  }))
}
