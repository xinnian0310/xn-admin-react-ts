import { useMemo, useState } from 'react'
import { Button, Checkbox, Input, InputNumber, Radio, Tabs } from 'antd'
import XnDialog from '@/components/XnDialog'
import {
  CRON_FIELDS,
  WEEK_LABELS,
  parseCron,
  stringifyCron,
  type CronFieldKey,
  type CronFieldMode,
  type CronFieldState,
} from '@/utils/cron'
import './xnCron.scss'

export type XnCronProps = {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

function weekLabel(n: number) {
  return WEEK_LABELS[(n - 1) % 7] || String(n)
}

function patchField(
  state: Record<CronFieldKey, CronFieldState>,
  key: CronFieldKey,
  patch: Partial<CronFieldState>,
): Record<CronFieldKey, CronFieldState> {
  return { ...state, [key]: { ...state[key], ...patch } }
}

export default function XnCron({
  value = '0 */5 * * * ?',
  onChange,
  disabled = false,
  placeholder = 'Quartz Cron，如 0 */5 * * * ?',
}: XnCronProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<CronFieldKey>('minute')
  const [state, setState] = useState(() => parseCron(value || ''))

  const preview = useMemo(() => stringifyCron(state), [state])

  function emit(next: string) {
    onChange?.(next)
  }

  function handleOpen() {
    setState(parseCron(value || ''))
    setOpen(true)
  }

  function apply() {
    emit(preview)
    setOpen(false)
  }

  return (
    <div className="xn-cron">
      <Input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => emit(e.target.value)}
        addonAfter={
          <Button type="default" htmlType="button" disabled={disabled} onClick={handleOpen}>
            编辑
          </Button>
        }
      />

      <XnDialog
        open={open}
        title="Cron 表达式"
        width={720}
        confirmText="应用"
        onCancel={() => setOpen(false)}
        onConfirm={apply}
      >
        <Tabs
          activeKey={active}
          onChange={(key) => setActive(key as CronFieldKey)}
          items={CRON_FIELDS.map((field) => {
            const current = state[field.key]
            return {
              key: field.key,
              label: field.label,
              children: (
                <div>
                  <Radio.Group
                    className="xn-cron__modes"
                    value={current.mode}
                    onChange={(e) =>
                      setState((prev) =>
                        patchField(prev, field.key, { mode: e.target.value as CronFieldMode }),
                      )
                    }
                    options={[
                      { label: `每${field.label}`, value: 'every' },
                      { label: '周期', value: 'interval' },
                      { label: '区间', value: 'range' },
                      { label: '指定', value: 'specific' },
                    ]}
                  />

                  {current.mode === 'interval' ? (
                    <div className="xn-cron__row">
                      从
                      <InputNumber
                        value={current.intervalStart}
                        min={field.min}
                        max={field.max}
                        onChange={(n) =>
                          setState((prev) =>
                            patchField(prev, field.key, { intervalStart: Number(n ?? field.min) }),
                          )
                        }
                      />
                      开始，每
                      <InputNumber
                        value={current.intervalStep}
                        min={1}
                        max={field.max}
                        onChange={(n) =>
                          setState((prev) =>
                            patchField(prev, field.key, { intervalStep: Number(n ?? 1) }),
                          )
                        }
                      />
                      {field.label}
                    </div>
                  ) : null}

                  {current.mode === 'range' ? (
                    <div className="xn-cron__row">
                      从
                      <InputNumber
                        value={current.rangeStart}
                        min={field.min}
                        max={field.max}
                        onChange={(n) =>
                          setState((prev) =>
                            patchField(prev, field.key, { rangeStart: Number(n ?? field.min) }),
                          )
                        }
                      />
                      到
                      <InputNumber
                        value={current.rangeEnd}
                        min={field.min}
                        max={field.max}
                        onChange={(n) =>
                          setState((prev) =>
                            patchField(prev, field.key, { rangeEnd: Number(n ?? field.max) }),
                          )
                        }
                      />
                    </div>
                  ) : null}

                  {current.mode === 'specific' ? (
                    <div className="xn-cron__chips">
                      <Checkbox.Group
                        value={current.specific}
                        onChange={(vals) =>
                          setState((prev) =>
                            patchField(prev, field.key, {
                              specific: vals.map((item) => Number(item)),
                            }),
                          )
                        }
                      >
                        {Array.from({ length: field.max - field.min + 1 }, (_, i) => {
                          const n = field.min + i
                          return (
                            <Checkbox key={n} value={n}>
                              {field.key === 'week' ? weekLabel(n) : n}
                            </Checkbox>
                          )
                        })}
                      </Checkbox.Group>
                    </div>
                  ) : null}
                </div>
              ),
            }
          })}
        />
        <div className="xn-cron__preview">
          预览：<code>{preview}</code>
        </div>
      </XnDialog>
    </div>
  )
}
