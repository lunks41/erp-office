import ExcelJS from "exceljs"

type JsonRow = Record<string, unknown> | unknown[]

type WorksheetData = {
  __type: "json-sheet"
  rows: JsonRow[]
}

type WorkbookData = {
  sheets: Array<{ name: string; worksheet: WorksheetData }>
}

function escapeCell(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object") return JSON.stringify(value)
  return value as string | number | boolean
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const utils = {
  json_to_sheet(rows: JsonRow[] = []): WorksheetData {
    return {
      __type: "json-sheet",
      rows,
    }
  },
  book_new(): WorkbookData {
    return { sheets: [] }
  },
  book_append_sheet(workbook: WorkbookData, worksheet: WorksheetData, name: string) {
    workbook.sheets.push({ name, worksheet })
  },
}

export async function writeFile(workbook: WorkbookData, filename: string) {
  const excelWorkbook = new ExcelJS.Workbook()

  for (const sheet of workbook.sheets) {
    const ws = excelWorkbook.addWorksheet(sheet.name || "Sheet1")
    const rows = sheet.worksheet?.rows ?? []
    const objectRows = rows.filter((row): row is Record<string, unknown> => !Array.isArray(row))
    const columns = Array.from(new Set(objectRows.flatMap((row) => Object.keys(row ?? {}))))

    if (columns.length > 0) {
      ws.columns = columns.map((key) => ({ header: key, key }))
      for (const row of rows) {
        if (Array.isArray(row)) {
          ws.addRow(row.map(escapeCell))
          continue
        }
        const normalized: Record<string, string | number | boolean | null> = {}
        for (const key of columns) {
          normalized[key] = escapeCell(row[key])
        }
        ws.addRow(normalized)
      }
    } else {
      for (const row of rows) {
        if (Array.isArray(row)) {
          ws.addRow(row.map(escapeCell))
        } else {
          ws.addRow(Object.values(row).map(escapeCell))
        }
      }
    }
  }

  const buffer = (await excelWorkbook.xlsx.writeBuffer()) as ArrayBuffer
  triggerDownload(buffer, filename)
}
