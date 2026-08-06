import * as XLSX from 'xlsx'
// Vite 需走 browser 构建，直接引用 dist，避免 import-analysis 解析失败
import ExcelJS from 'exceljs/dist/exceljs.min.js'
import type { ExcelImportColumn } from '@/types/excel'

function headerTitle(col: ExcelImportColumn) {
  return col.required ? `${col.title}*` : col.title
}

/** 将单元格中文（或编码）映射为 option.value；支持逗号分隔多选 */
export function resolveOptionValue(raw: string, options?: ExcelImportColumn['options']): string {
  if (!raw || !options?.length) return raw
  const text = raw.trim()
  if (!text) return ''
  const parts = text
    .split(/[,，;；]/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts
    .map((part) => {
      const byLabel = options.find((o) => o.label === part)
      if (byLabel) return byLabel.value
      const byValue = options.find((o) => o.value === part)
      if (byValue) return byValue.value
      return part
    })
    .join(',')
}

function isExampleRow(row: Record<string, string>, columns: ExcelImportColumn[]) {
  return columns.every((c) => {
    const cell = row[c.key] ?? ''
    const rawExample = c.example ?? ''
    const mappedExample = resolveOptionValue(rawExample, c.options)
    return cell === rawExample || cell === mappedExample
  })
}

/** 下载带中文下拉的导入模板 */
export async function downloadExcelTemplate(columns: ExcelImportColumn[], fileName: string) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '心念后台管理系统'
  const sheet = workbook.addWorksheet('导入模板', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.addRow(columns.map(headerTitle))
  sheet.addRow(columns.map((c) => c.example ?? ''))

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF409EFF' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 24

  columns.forEach((col, index) => {
    const colIndex = index + 1
    sheet.getColumn(colIndex).width = col.width ?? Math.max(14, col.title.length + 4)
    if (!col.options?.length) return

    const listName = `_opts_${col.key}`.slice(0, 31)
    let listSheet = workbook.getWorksheet(listName)
    if (!listSheet) {
      listSheet = workbook.addWorksheet(listName, { state: 'hidden' })
      col.options.forEach((opt, i) => {
        listSheet!.getCell(i + 1, 1).value = opt.label
      })
    }
    const lastRow = Math.max(col.options.length, 1)
    const formulae = [`'${listName}'!$A$1:$A$${lastRow}`]
    for (let r = 2; r <= 2001; r++) {
      sheet.getCell(r, colIndex).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae,
        showErrorMessage: true,
        errorTitle: '无效选项',
        error: `请从下拉列表中选择「${col.title}」`,
        showInputMessage: true,
        promptTitle: col.title,
        prompt: `请选择${col.title}`,
      }
    }
  })

  const tipSheet = workbook.addWorksheet('填写说明')
  tipSheet.getColumn(1).width = 18
  tipSheet.getColumn(2).width = 56
  tipSheet.addRow(['说明', '内容'])
  tipSheet.getRow(1).font = { bold: true }
  tipSheet.addRow(['带 * 列', '必填'])
  tipSheet.addRow(['角色 / 单位 / 状态', '请用单元格下拉选择中文名称'])
  tipSheet.addRow(['多个角色', '可在单元格内用中文逗号分隔多个角色名称'])
  tipSheet.addRow(['密码为空', '导入时使用默认密码 User123456'])

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export interface ExcelExportColumn {
  /** 行数据字段名 */
  key: string
  /** 表头中文名 */
  title: string
  /** 列宽 */
  width?: number
}

/** 纯客户端导出：将当前查询结果的行数据导出为 xlsx，无需后端接口 */
export async function exportRowsToExcel(
  rows: Record<string, unknown>[],
  columns: ExcelExportColumn[],
  fileName: string,
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '心念后台管理系统'
  const sheet = workbook.addWorksheet('数据')

  sheet.addRow(columns.map((c) => c.title))
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF409EFF' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 24

  columns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width ?? Math.max(14, col.title.length + 4)
  })

  rows.forEach((row) => {
    sheet.addRow(columns.map((c) => row[c.key] ?? ''))
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 解析 Excel「导入模板」或首个工作表（保留单元格原文，含中文下拉值）。
 * 提交前请用 mapImportRows 将 options 列映射为编码。
 */
export function parseExcelFile(
  file: File,
  columns: ExcelImportColumn[],
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const book = XLSX.read(data, { type: 'array' })
        const sheetName = book.SheetNames.find((n) => n === '导入模板') || book.SheetNames[0]
        if (!sheetName) {
          reject(new Error('Excel 中没有工作表'))
          return
        }
        const sheet = book.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        })
        const titleToKey = new Map<string, string>()
        for (const col of columns) {
          titleToKey.set(col.title, col.key)
          titleToKey.set(`${col.title}*`, col.key)
        }

        const mapped = rawRows.map((row) => {
          const item: Record<string, string> = {}
          for (const [header, value] of Object.entries(row)) {
            const key = titleToKey.get(String(header).trim())
            if (key) {
              item[key] = value == null ? '' : String(value).trim()
            }
          }
          return item
        })

        resolve(
          mapped.filter((row) => {
            const hasAny = columns.some((c) => !!row[c.key])
            return hasAny && !isExampleRow(row, columns)
          }),
        )
      } catch (err) {
        reject(err instanceof Error ? err : new Error('解析 Excel 失败'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsArrayBuffer(file)
  })
}

/** 将带 options 的列从中文映射为提交值 */
export function mapImportRows(
  rows: Record<string, string>[],
  columns: ExcelImportColumn[],
): Record<string, string>[] {
  return rows.map((row) => {
    const next = { ...row }
    for (const col of columns) {
      if (col.options?.length && next[col.key] != null) {
        next[col.key] = resolveOptionValue(next[col.key], col.options)
      }
    }
    return next
  })
}

/** 校验必填列 */
export function validateImportRows(
  rows: Record<string, string>[],
  columns: ExcelImportColumn[],
): string | null {
  const required = columns.filter((c) => c.required)
  for (let i = 0; i < rows.length; i++) {
    for (const col of required) {
      if (!rows[i][col.key]) {
        return `第 ${i + 2} 行「${col.title}」不能为空`
      }
    }
  }
  return null
}
