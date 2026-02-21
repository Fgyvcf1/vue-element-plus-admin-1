import { getAppConfig } from '@/api/appConfig'
import { useAppStoreWithOut } from '@/store/modules/app'

export const loadAppConfig = async () => {
  try {
    const res = await getAppConfig()
    if (res?.code === 20000 && res.data) {
      useAppStoreWithOut().setBranding(res.data)
    }
  } catch (error) {
    console.error('获取系统品牌配置失败:', error)
  }
}
