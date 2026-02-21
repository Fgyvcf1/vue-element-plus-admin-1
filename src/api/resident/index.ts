import request from '@/axios'
import type {
  ResidentListParams,
  ResidentListResponse,
  ResidentDetail,
  SearchSuggestionsResponse
} from './types'

// 获取居民列表
export const getResidentList = (params: ResidentListParams) => {
  return request.get({
    url: '/residents',
    params
  }) as Promise<ResidentListResponse>
}

// 别名 - 兼容旧代码
export const getResidents = getResidentList

// 搜索居民（用于调解档案的自动完成）
export const searchResidents = (params: { keyword: string; page?: number; pageSize?: number }) => {
  return request.get({
    url: '/residents',
    params: {
      keyword: params.keyword,
      pageNum: params.page || 1,
      pageSize: params.pageSize || 10
    }
  }) as Promise<ResidentListResponse>
}

// 获取居民详情
export const getResidentDetail = (id: string) => {
  return request.get<ResidentDetail>({
    url: `/residents/${id}`
  })
}

// 兼容旧代码，获取单个居民详情
export const getResident = (id: number | string) => {
  return request.get<ResidentDetail>({
    url: `/residents/${id}`
  })
}

// 导出居民信息
export const exportResidents = (params: Partial<ResidentListParams>) => {
  return request.get<Blob>({
    url: '/residents/export',
    params,
    responseType: 'blob'
  })
}

// 新增居民
export const addResident = (data: Partial<ResidentDetail>) => {
  return request.post({
    url: '/residents',
    data
  })
}

// 更新居民
export const updateResident = (id: string, data: Partial<ResidentDetail>) => {
  return request.put({
    url: `/residents/${id}`,
    data
  })
}

// 更新居民状态（迁途改销）
export const updateResidentStatus = (
  id: string,
  data: {
    status: string
    death_date?: string
    death_reason?: string
    migration_in_date?: string
    migration_in_reason?: string
    migration_out_date?: string
    migration_out_reason?: string
  }
) => {
  return request.put({
    url: `/residents/${id}/status`,
    data
  })
}

// 删除居民
export const deleteResident = (id: string) => {
  return request.delete({
    url: `/residents/${id}`
  })
}

// 批量删除居民
export const batchDeleteResidents = (ids: string[]) => {
  return request.post({
    url: '/residents/batch-delete',
    data: { ids }
  })
}

// 获取村组列表
export const getVillageGroups = () => {
  return request.get<{ label: string; value: string }[]>({
    url: '/dictionaries',
    params: { category: '村组' }
  })
}

// 获取搜索建议
export const getSearchSuggestions = (params: { keyword: string; type: string }) => {
  return request.get({
    url: '/search-suggestions',
    params
  }) as Promise<SearchSuggestionsResponse>
}

// 导入居民数据
export const importResidents = (data: {
  headers: string[]
  data: any[][]
  mapping: { excelField: string; dbField: string }[]
}) => {
  return request.post({
    url: '/import-residents',
    data
  })
}

// 新增户主
export const addHousehold = (data: any) => {
  return request.post({
    url: '/households',
    data
  })
}
