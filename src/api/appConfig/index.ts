import request from '@/axios'

export interface AppConfigPayload {
  title?: string
  logoMode?: 'image' | 'text' | 'both'
  logoText?: string
  logoUrl?: string
  faviconUrl?: string
}

export const getAppConfig = () => {
  return request.get<AppConfigPayload>({
    url: '/app-config'
  })
}

export const updateAppConfig = (data: AppConfigPayload) => {
  return request.put({
    url: '/app-config',
    data
  })
}

export const uploadAppAsset = (file: File, type: 'logo' | 'favicon') => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ url: string }>({
    url: `/app-config/upload?type=${type}`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
