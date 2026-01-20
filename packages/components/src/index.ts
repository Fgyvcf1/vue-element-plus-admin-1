/**
 * @vea/components - Vue Element Plus Admin 公用组件库
 */
import type { App } from 'vue'

// 导出所有组件
export * from './Icon'
export * from './Permission'
export * from './Button'
export * from './Avatars'
export * from './Backtop'
export * from './Breadcrumb'
export * from './CodeEditor'
export * from './Collapse'
export * from './ConfigGlobal'
export * from './ContentDetailWrap'
export * from './ContentWrap'
export * from './ContextMenu'
export * from './CountTo'
export * from './Descriptions'
export * from './Dialog'
export * from './Echart'
export * from './Editor'
export * from './Error'
export * from './Footer'
export * from './Form'
export * from './Highlight'
export * from './IAgree'
export * from './IconPicker'
export * from './ImageCropping'
export * from './ImageViewer'
export * from './Infotip'
export * from './InputPassword'
export * from './JsonEditor'
export * from './LocaleDropdown'
export * from './Logo'
export * from './Menu'
export * from './Qrcode'
export * from './Screenfull'
export * from './Search'
export * from './Setting'
export * from './SizeDropdown'
export * from './Table'
export * from './TabMenu'
export * from './TagsView'
export * from './ThemeSwitch'
export * from './Tree'
export * from './UserInfo'
export * from './VideoPlayer'
export * from './VideoPlayerViewer'
export * from './Waterfall'

// 导入组件
import { Icon } from './Icon'
import { Permission } from './Permission'
import { BaseButton } from './Button'

/**
 * 全局注册组件
 */
export const setupGlobCom = (app: App<Element>): void => {
  app.component('Icon', Icon)
  app.component('Permission', Permission)
  app.component('BaseButton', BaseButton)
}

export default {
  install: setupGlobCom
}
