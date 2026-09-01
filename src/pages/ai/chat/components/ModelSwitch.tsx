import { useMemo } from 'react'
import { Button, Cascader } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { ModelListData } from '@/types/ai/model'
import { groupModelsByProvider, modelDotClass } from '@/utils/ai-model-cascader'
import { isImageSrc } from '@/utils/icons'

interface Props {
  models: ModelListData
  modelPick: string
  streaming: boolean
  hasModel: boolean
  quotaLow: boolean
  onModelPick: (value: string) => void
  onChange: (value: string) => void
}

export default function ModelSwitch({
  models,
  modelPick,
  streaming,
  hasModel,
  quotaLow,
  onModelPick,
  onChange,
}: Props) {
  const navigate = useNavigate()

  const cascaderOptions = useMemo(() => {
    const sources = []
    if (models.trial) {
      sources.push({
        id: models.trial.id,
        name: models.trial.name,
        modelId: models.trial.modelId,
        modelDisplayName: models.trial.modelDisplayName || models.trial.name,
        providerId: models.trial.providerId,
        providerName: models.trial.providerName,
        providerIcon: models.trial.providerIcon,
        lastCheckOk: models.trial.lastCheckOk ?? null,
        trial: true,
      })
    }
    for (const model of models.mine || []) {
      sources.push({
        id: model.id,
        name: model.name || model.modelDisplayName,
        modelId: model.modelId,
        modelDisplayName: model.modelDisplayName,
        providerId: model.providerId,
        providerName: model.providerName,
        providerIcon: model.providerIcon,
        lastCheckOk: model.lastCheckOk ?? null,
      })
    }
    return groupModelsByProvider(sources).map((group) => ({
      value: group.value,
      label: group.label,
      icon: group.icon,
      children: group.children.map((leaf) => ({
        value: leaf.value,
        label: leaf.label,
        disabled: leaf.disabled,
        lastCheckOk: leaf.lastCheckOk,
      })),
    }))
  }, [models])

  let cascaderValue: string[] | undefined
  if (modelPick) {
    for (const group of cascaderOptions) {
      if (group.children.some((item) => item.value === modelPick)) {
        cascaderValue = [group.value, modelPick]
        break
      }
    }
  }

  return (
    <header className="ai-chat__bar">
      <Cascader
        key={modelPick || 'none'}
        className="ai-chat__model-pick"
        value={cascaderValue}
        options={cascaderOptions}
        disabled={!hasModel || streaming}
        expandTrigger="hover"
        showSearch
        allowClear={false}
        placeholder="先选厂商，再选模型"
        displayRender={(labels) => labels[labels.length - 1]}
        optionRender={(option) => {
          const data = option as typeof option & { icon?: string; lastCheckOk?: boolean | null }
          const isLeaf = !option.children?.length
          return (
            <span className="ai-chat__model-opt">
              {isLeaf ? <i className={`status-dot ${modelDotClass(data.lastCheckOk)}`} /> : null}
              {isImageSrc(data.icon) ? (
                <img src={data.icon} className="ai-chat__model-logo" alt="" />
              ) : null}
              <span>{String(option.label ?? '')}</span>
            </span>
          )
        }}
        onChange={(value) => {
          const next = Array.isArray(value) && value.length ? String(value[value.length - 1]) : ''
          const leaf = cascaderOptions
            .flatMap((group) => group.children)
            .find((item) => item.value === next)
          if (leaf?.disabled) return
          onModelPick(next)
          if (next) onChange(next)
        }}
      />
      {quotaLow ? (
        <Button type="link" onClick={() => navigate('/ai/models')}>
          去添加我的模型
        </Button>
      ) : null}
    </header>
  )
}
