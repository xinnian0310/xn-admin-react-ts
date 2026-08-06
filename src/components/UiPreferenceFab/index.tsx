import { Drawer, Form, Radio, Button, Space, Input } from 'antd'
import { FloatButton } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useUiPreferenceStore } from '@/stores/uiPreference'
import { appConfig, type LayoutMode } from '@/config/app'

export default function UiPreferenceFab() {
  const drawerVisible = useUiPreferenceStore((s) => s.drawerVisible)
  const openDrawer = useUiPreferenceStore((s) => s.openDrawer)
  const closeDrawer = useUiPreferenceStore((s) => s.closeDrawer)
  const preference = useUiPreferenceStore((s) => s.preference)
  const save = useUiPreferenceStore((s) => s.save)
  const reset = useUiPreferenceStore((s) => s.reset)
  const [form] = Form.useForm()

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        tooltip="界面偏好"
        style={{ right: 24, bottom: 24 }}
        onClick={() => {
          form.setFieldsValue({
            mode: preference?.layout?.mode || appConfig.ui.layout.mode,
            main: preference?.fontSize?.main || appConfig.ui.fontSize.main,
            tagsHeight: preference?.tagsView?.height || appConfig.ui.tagsView.height,
          })
          openDrawer()
        }}
      />
      <Drawer title="界面偏好" open={drawerVisible} onClose={closeDrawer} width={360}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await save({
              layout: { mode: values.mode as LayoutMode },
              fontSize: { main: values.main },
              tagsView: { height: values.tagsHeight },
            })
            closeDrawer()
          }}
        >
          <Form.Item name="mode" label="布局模式">
            <Radio.Group
              optionType="button"
              options={[
                { label: '侧栏', value: 'side' },
                { label: '顶栏', value: 'top' },
                { label: '混合', value: 'mix' },
                { label: '双列', value: 'columns' },
              ]}
            />
          </Form.Item>
          <Form.Item name="main" label="正文字号">
            <Input placeholder="如 14px" />
          </Form.Item>
          <Form.Item name="tagsHeight" label="标签栏高度">
            <Input placeholder="如 40px" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button
              onClick={async () => {
                await reset()
                closeDrawer()
              }}
            >
              重置
            </Button>
          </Space>
        </Form>
      </Drawer>
    </>
  )
}
