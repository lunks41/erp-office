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
