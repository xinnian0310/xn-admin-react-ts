import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Alert, Button, Space, Table, Upload, message } from 'antd'
import {
  DownloadOutlined,
  InboxOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons'
import type { ExcelImportColumn, ExcelImportSubmit, ImportResult } from '@/types/excel'
import {
  downloadExcelTemplate,
  mapImportRows,
  parseExcelFile,
  validateImportRows,
} from '@/utils/excel'
import XnModal from '@/components/XnModal'
export interface XnImportHandle {
  open: () => void
}

interface XnImportProps {
  title?: string
  columns: ExcelImportColumn[]
  templateName?: string
  importer: ExcelImportSubmit
  maxRows?: number
  previewLimit?: number
  onSuccess?: (result?: ImportResult | void) => void
}

const XnImport = forwardRef<XnImportHandle, XnImportProps>(function XnImport(
  {
    title = 'Excel 导入',
    columns,
    templateName = '导入模板',
    importer,
    maxRows = 2000,
    previewLimit = 50,
    onSuccess,
  },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  const previewRows = useMemo(() => rows.slice(0, previewLimit), [rows, previewLimit])

  function reset() {
    setFileName('')
    setRows([])
    setResult(null)
    setParsing(false)
    setSubmitting(false)
  }

  useImperativeHandle(ref, () => ({
    open() {
      reset()
      setVisible(true)
    },
  }))

  async function handleDownloadTemplate() {
    try {
      await downloadExcelTemplate(columns, templateName)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '模板下载失败')
    }
  }

  async function handleFile(file: File) {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      message.warning('请上传 Excel 文件（.xlsx / .xls）')
      return false
    }
    setParsing(true)
    setResult(null)
    try {
      const parsed = await parseExcelFile(file, columns)
      if (!parsed.length) {
        message.warning('未解析到有效数据行（请勿只保留示例行）')
        setFileName('')
        setRows([])
        return false
      }
      if (parsed.length > maxRows) {
        message.warning(`超过单次上限 ${maxRows} 行`)
        return false
      }
      const err = validateImportRows(parsed, columns)
      if (err) {
        message.error(err)
        return false
      }
      setFileName(file.name)
      setRows(parsed)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '解析失败')
    } finally {
      setParsing(false)
    }
    return false
  }

  async function handleSubmit() {
    if (!rows.length) return
    setSubmitting(true)
    try {
      const mapped = mapImportRows(rows, columns)
      const res = await importer(mapped)
      if (res && typeof res === 'object' && 'success' in res) {
        setResult(res)
        onSuccess?.(res)
        if (res.failed === 0) {
          message.success(`导入成功 ${res.success} 条`)
          setVisible(false)
        }
      } else {
        message.success('导入成功')
        onSuccess?.(res)
        setVisible(false)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导入失败')
    } finally {
      setSubmitting(false)
    }
  }

  const tableColumns = columns.map((col) => ({
    title: col.required ? `${col.title}*` : col.title,
    dataIndex: col.key,
    key: col.key,
    ellipsis: true,
  }))

  return (
    <XnModal
      title={title}
      open={visible}
      onCancel={() => setVisible(false)}
      afterClose={reset}
      width={780}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={() => setVisible(false)}>关闭</Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!rows.length}
            onClick={() => void handleSubmit()}
          >
            开始导入
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>1. 下载模板</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
            按表头填写；带 * 为必填，下拉列请选中文名称
          </div>
          <Button icon={<DownloadOutlined />} onClick={() => void handleDownloadTemplate()}>
            下载 Excel 模板
          </Button>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>2. 上传文件</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
            支持 .xlsx / .xls，单次不超过 {maxRows} 行
          </div>
          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleFile(file)
              return false
            }}
            disabled={parsing}
          >
            {parsing ? (
              <div>
                <LoadingOutlined style={{ fontSize: 28 }} />
                <div>正在解析…</div>
              </div>
            ) : fileName ? (
              <div>
                <CheckCircleFilled style={{ fontSize: 28, color: '#52c41a' }} />
                <div style={{ marginTop: 8 }}>{fileName}</div>
                <div style={{ color: '#94a3b8' }}>
                  共 {rows.length} 行有效数据 · 点击或拖拽可重新选择
                </div>
              </div>
            ) : (
              <div>
                <InboxOutlined style={{ fontSize: 36 }} />
                <div>
                  将文件拖到此处，或 <em>点击上传</em>
                </div>
                <div style={{ color: '#94a3b8' }}>仅支持 Excel 文件</div>
              </div>
            )}
          </Upload.Dragger>
        </div>

        {rows.length ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>数据预览</span>
              <span style={{ color: '#94a3b8' }}>
                {rows.length > previewLimit
                  ? `前 ${previewLimit} / 共 ${rows.length} 行`
                  : `${rows.length} 行`}
              </span>
            </div>
            <Table
              size="small"
              bordered
              rowKey={(_, i) => String(i)}
              pagination={false}
              scroll={{ y: 280 }}
              dataSource={previewRows}
              columns={[
                {
                  title: '#',
                  width: 50,
                  render: (_v, _r, i) => i + 1,
                },
                ...tableColumns,
              ]}
            />
          </div>
        ) : null}

        {result ? (
          <div>
            <Alert
              type={result.failed > 0 ? 'warning' : 'success'}
              showIcon
              message={`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`}
            />
            {result.errors?.length ? (
              <Table
                style={{ marginTop: 8 }}
                size="small"
                bordered
                pagination={false}
                scroll={{ y: 160 }}
                rowKey={(_, i) => String(i)}
                dataSource={result.errors}
                columns={[
                  { title: '行号', dataIndex: 'row', width: 80 },
                  { title: '原因', dataIndex: 'message', ellipsis: true },
                ]}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </XnModal>
  )
})

export default XnImport

