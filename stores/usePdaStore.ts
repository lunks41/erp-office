import { create } from "zustand"

import { IPdaDt, IPdaHd } from "@/interfaces/IPda"

interface PdaStore {
  pdaList: IPdaHd[]
  currentPda: IPdaHd | null
  chargeLines: IPdaDt[]
  isLoading: boolean
  isSaving: boolean
  setPdaList: (list: IPdaHd[]) => void
  setCurrentPda: (pda: IPdaHd | null) => void
  setChargeLines: (lines: IPdaDt[]) => void
  addChargeLine: () => void
  addSectionWithSubRow: (sectionNo: string, description: string) => void
  addSubRowToSection: (sectionItemNo: number) => void
  updateChargeLine: (itemNo: number, field: keyof IPdaDt, value: unknown) => void
  deleteChargeLine: (itemNo: number) => void
  getGroupedLines: () => Array<IPdaDt & { children: IPdaDt[] }>
  reorderLines: () => void
  calculateTotals: () => {
    subTotal: number
    vatAmount: number
    grandTotal: number
  }
  setLoading: (v: boolean) => void
  setSaving: (v: boolean) => void
  reset: () => void
}

const EMPTY_LINE: Omit<IPdaDt, "itemNo"> = {
  companyId: 0,
  pdaId: 0,
  rowType: 0,
  parentItemNo: null,
  sectionNo: "",
  sectionAmount: 0,
  taskId: 0,
  taskName: "",
  chargeId: 0,
  chargeName: "",
  tariffId: null,
  tariffItemNo: null,
  description: "",
  qty: 0,
  unit: "",
  rate: 0,
  amount: 0,
  currencyId: 0,
  isEstimate: false,
  isManual: true,
  isWarningComment: false,
  remarks: "",
}

const getNextItemNo = (lines: IPdaDt[]) =>
  lines.reduce((max, line) => Math.max(max, line.itemNo), 0) + 1

const recalculateSectionAmounts = (lines: IPdaDt[]) => {
  const sectionItemNos = new Set(
    lines.filter((line) => line.rowType === 1).map((line) => line.itemNo)
  )
  const strictLines = lines.filter(
    (line) =>
      line.rowType === 1 ||
      (line.rowType === 0 &&
        line.parentItemNo !== null &&
        sectionItemNos.has(line.parentItemNo))
  )
  const next = [...strictLines]
  return next.map((line) => {
    if (line.rowType !== 1) return line
    const sectionAmount = next
      .filter((child) => child.rowType === 0 && child.parentItemNo === line.itemNo)
      .reduce((sum, child) => sum + (Number(child.amount) || 0), 0)
    return { ...line, sectionAmount, amount: sectionAmount }
  })
}

export const usePdaStore = create<PdaStore>((set, get) => ({
  pdaList: [],
  currentPda: null,
  chargeLines: [],
  isLoading: false,
  isSaving: false,
  setPdaList: (list) => set({ pdaList: list }),
  setCurrentPda: (pda) => set({ currentPda: pda }),
  setChargeLines: (lines) => set({ chargeLines: recalculateSectionAmounts(lines) }),
  addChargeLine: () => {
    const newLine: IPdaDt = {
      ...EMPTY_LINE,
      itemNo: getNextItemNo(get().chargeLines),
    }
    set((state) => ({ chargeLines: recalculateSectionAmounts([...state.chargeLines, newLine]) }))
  },
  addSectionWithSubRow: (sectionNo, description) => {
    const lines = get().chargeLines
    const sectionItemNo = getNextItemNo(lines)
    const subItemNo = sectionItemNo + 1
    const sectionRow: IPdaDt = {
      ...EMPTY_LINE,
      itemNo: sectionItemNo,
      rowType: 1,
      sectionNo,
      description,
      amount: 0,
      sectionAmount: 0,
    }
    const subRow: IPdaDt = {
      ...EMPTY_LINE,
      itemNo: subItemNo,
      rowType: 0,
      parentItemNo: sectionItemNo,
      description: "New line",
      qty: 0,
      rate: 0,
      amount: 0,
    }
    set({ chargeLines: recalculateSectionAmounts([...lines, sectionRow, subRow]) })
  },
  addSubRowToSection: (sectionItemNo) => {
    const lines = get().chargeLines
    const sectionExists = lines.some(
      (line) => line.rowType === 1 && line.itemNo === sectionItemNo
    )
    if (!sectionExists) return
    const subRow: IPdaDt = {
      ...EMPTY_LINE,
      itemNo: getNextItemNo(lines),
      rowType: 0,
      parentItemNo: sectionItemNo,
      description: "New line",
      qty: 0,
      rate: 0,
      amount: 0,
    }
    set({ chargeLines: recalculateSectionAmounts([...lines, subRow]) })
  },
  updateChargeLine: (itemNo, field, value) => {
    set((state) => {
      const updated = state.chargeLines.map((line) => {
        if (line.itemNo !== itemNo) return line

        if (
          line.rowType === 1 &&
          field !== "sectionNo" &&
          field !== "description" &&
          field !== "remarks"
        ) {
          return line
        }

        const nextLine = {
          ...line,
          [field]: value,
        } as IPdaDt

        if (field === "qty" || field === "rate") {
          const qty = Number(field === "qty" ? value : nextLine.qty) || 0
          const rate = Number(field === "rate" ? value : nextLine.rate) || 0
          nextLine.amount = qty * rate
        }

        return nextLine
      })
      return { chargeLines: recalculateSectionAmounts(updated) }
    })
  },
  deleteChargeLine: (itemNo) => {
    set((state) => ({
      chargeLines: recalculateSectionAmounts(
        state.chargeLines.filter(
          (line) => line.itemNo !== itemNo && line.parentItemNo !== itemNo
        )
      ),
    }))
  },
  getGroupedLines: () => {
    const lines = get().chargeLines
    const sections = lines.filter((r) => r.rowType === 1)
    return sections.map((section) => ({
      ...section,
      children: lines.filter((r) => r.rowType === 0 && r.parentItemNo === section.itemNo),
    }))
  },
  reorderLines: () => {
    set((state) => ({
      chargeLines: recalculateSectionAmounts(
        state.chargeLines.map((line, index) => ({ ...line, itemNo: index + 1 }))
      ),
    }))
  },
  calculateTotals: () => {
    const { chargeLines, currentPda } = get()
    const subTotal = chargeLines.reduce(
      (sum, line) => sum + (line.rowType === 1 ? 0 : Number(line.amount) || 0),
      0
    )
    const vatAmount = Number(currentPda?.vatAmount || 0)
    const advanceReceived = Number(currentPda?.advanceReceived || 0)
    const grandTotal = subTotal + vatAmount - advanceReceived

    return { subTotal, vatAmount, grandTotal }
  },
  setLoading: (v) => set({ isLoading: v }),
  setSaving: (v) => set({ isSaving: v }),
  reset: () =>
    set({
      pdaList: [],
      currentPda: null,
      chargeLines: [],
      isLoading: false,
      isSaving: false,
    }),
}))
