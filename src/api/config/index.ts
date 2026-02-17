import request from '@/axios'

export const getConfigList = (params: {
  page?: number
  pageSize?: number
  group?: string
  keyword?: string
}) => {
  return request.get({
    url: '/config',
    params
  })
}

export const getConfigGroups = () => {
  return request.get({
    url: '/config/groups'
  })
}

export const updateConfig = (key: string, value: string | number) => {
  return request.put({
    url: `/config/${key}`,
    data: { value }
  })
}

export const updateConfigsBatch = (configs: Array<{ key: string; value: string | number }>) => {
  return request.put({
    url: '/config',
    data: { configs }
  })
}

export const createConfig = (data: {
  key: string
  value: string | number
  name: string
  group?: string
  type?: string
  description?: string
  isSystem?: boolean
}) => {
  return request.post({
    url: '/config',
    data
  })
}

export const deleteConfig = (key: string) => {
  return request.delete({
    url: `/config/${key}`
  })
}
