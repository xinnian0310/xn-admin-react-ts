import { Boot } from '@wangeditor/editor'
import ctrlEnterModule from '@wangeditor/plugin-ctrl-enter'
import formulaModule from '@wangeditor/plugin-formula'
import linkCardModule from '@wangeditor/plugin-link-card'
import markdownModule from '@wangeditor/plugin-md'
import mentionModule from '@wangeditor/plugin-mention'
import attachmentModule from '@wangeditor/plugin-upload-attachment'

let registered = false

function asModule(mod: unknown) {
  const raw = mod as { default?: unknown; menus?: unknown; editorPlugin?: unknown }
  if (raw?.menus || raw?.editorPlugin) return raw
  return raw?.default ?? raw
}

/** wangEditor 插件只能注册一次，且必须在创建编辑器之前 */
export function registerRichEditorPlugins() {
  if (registered) return
  registered = true
  Boot.registerModule(asModule(markdownModule) as never)
  Boot.registerModule(asModule(formulaModule) as never)
  Boot.registerModule(asModule(mentionModule) as never)
  Boot.registerModule(asModule(attachmentModule) as never)
  Boot.registerModule(asModule(linkCardModule) as never)
  Boot.registerModule(asModule(ctrlEnterModule) as never)
}

registerRichEditorPlugins()
