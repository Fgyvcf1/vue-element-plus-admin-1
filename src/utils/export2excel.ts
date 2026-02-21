import * as XLSX from 'xlsx'

type ExportOptions = {
  header?: string[]
  data: (string | number | boolean | null | undefined)[][]
  filename?: string
  autoWidth?: boolean
  bookType?: XLSX.BookType
  textColumns?: number[]
}

const toText = (value: unknown) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

export const export_json_to_excel = (options: ExportOptions) => {
  const header = options.header ?? []
  const rows = options.data ?? []
  const data = header.length ? [header, ...rows] : rows

  const worksheet = XLSX.utils.aoa_to_sheet(data)

  // Force specific columns to text if requested
  if (options.textColumns && options.textColumns.length > 0) {
    const textCols = new Set(options.textColumns.map((n) => n - 1))
    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < data[r].length; c++) {
        if (!textCols.has(c)) continue
        const cellRef = XLSX.utils.encode_cell({ r, c })
        const cell = worksheet[cellRef]
        if (cell) {
          cell.t = 's'
          cell.v = toText(cell.v)
        }
      }
    }
  }

  if (options.autoWidth) {
    const colWidths = data.reduce<number[]>((acc, row) => {
      row.forEach((val, idx) => {
        const len = toText(val).length
        acc[idx] = Math.max(acc[idx] || 10, len + 2)
      })
      return acc
    }, [])
    worksheet['!cols'] = colWidths.map((wch) => ({ wch }))
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  const filename = options.filename ? `${options.filename}.xlsx` : 'export.xlsx'
  XLSX.writeFile(workbook, filename, { bookType: options.bookType || 'xlsx' })
}
