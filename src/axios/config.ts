import { AxiosResponse, InternalAxiosRequestConfig } from './types'
import { ElMessage } from 'element-plus'
import qs from 'qs'
import { SUCCESS_CODE, TRANSFORM_REQUEST_DATA } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { objToFormData } from '@/utils'

const LOCALHOST_HOST_RE = /^(localhost|127(?:\.\d{1,3}){3})$/i

const normalizeAssetUrl = (value: string) => {
  if (!value || typeof window === 'undefined') return value
  if (!/^https?:\/\//i.test(value)) return value
  try {
    const parsed = new URL(value)
    if (!LOCALHOST_HOST_RE.test(parsed.hostname)) return value
    const path = parsed.pathname || ''
    const isAssetPath =
      path.startsWith('/uploads/') ||
      path.startsWith('/archives/') ||
      path.startsWith('/logo') ||
      path.startsWith('/favicon')
    if (!isAssetPath) return value
    return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return value
  }
}

const normalizeResponseAssets = (payload: any): any => {
  if (typeof payload === 'string') {
    return normalizeAssetUrl(payload)
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeResponseAssets(item))
  }
  if (payload && typeof payload === 'object') {
    Object.keys(payload).forEach((key) => {
      payload[key] = normalizeResponseAssets(payload[key])
    })
  }
  return payload
}

const defaultRequestInterceptors = (config: InternalAxiosRequestConfig) => {
  // 添加用户ID到请求头（用于后端权限验证）
  const userStore = useUserStoreWithOut()
  const userId = userStore.getUserInfo?.id
  if (userId) {
    config.headers['X-User-Id'] = String(userId)
  }

  if (
    config.method === 'post' &&
    config.headers['Content-Type'] === 'application/x-www-form-urlencoded'
  ) {
    config.data = qs.stringify(config.data)
  } else if (
    TRANSFORM_REQUEST_DATA &&
    config.method === 'post' &&
    config.headers['Content-Type'] === 'multipart/form-data' &&
    !(config.data instanceof FormData)
  ) {
    config.data = objToFormData(config.data)
  }
  if (config.method === 'get' && config.params) {
    let url = config.url as string
    url += '?'
    const keys = Object.keys(config.params)
    for (const key of keys) {
      if (config.params[key] !== void 0 && config.params[key] !== null) {
        url += `${key}=${encodeURIComponent(config.params[key])}&`
      }
    }
    url = url.substring(0, url.length - 1)
    config.params = {}
    config.url = url
  }
  return config
}

const defaultResponseInterceptors = (response: AxiosResponse) => {
  if (response?.config?.responseType === 'blob') {
    // 如果是文件流，直接过
    return response
  } else if (response.data.code === SUCCESS_CODE) {
    return normalizeResponseAssets(response.data)
  } else {
    if (response?.data?.code === 403) {
      ElMessage.warning('当前账号没有权限')
    } else if (response?.data?.code !== 401) {
      ElMessage.error(response?.data?.message)
    }
    if (response?.data?.code === 401) {
      const userStore = useUserStoreWithOut()
      userStore.logout()
    }
    // 返回数据，让前端可以处理错误
    return response.data
  }
}

export { defaultResponseInterceptors, defaultRequestInterceptors }
