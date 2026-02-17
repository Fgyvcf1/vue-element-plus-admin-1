import request from '@/axios'

// 根据分类获取字典数据
export const getDictionaryByCategory = (category: string) => {
  return request.get({
    url: '/dictionary/category',
    params: { category }
  })
}

// 获取所有字典分类
export const getDictionaryCategories = (params?: { withCount?: number | boolean }) => {
  return request.get({
    url: '/dictionary/categories',
    params
  })
}

// 获取字典项列表
export const getDictionaryItems = (params: {
  category: string
  include_all?: number | boolean
}) => {
  return request.get({
    url: '/dictionary',
    params
  })
}

// 新增字典项
export const createDictionaryItem = (data: {
  category: string
  value: string
  display_order?: number
  status?: string
}) => {
  return request.post({
    url: '/dictionary',
    data
  })
}

// 修改字典项
export const updateDictionaryItem = (
  id: number,
  data: { category?: string; value?: string; display_order?: number }
) => {
  return request.put({
    url: `/dictionary/${id}`,
    data
  })
}

// 切换字典项状态
export const updateDictionaryStatus = (id: number, status: string) => {
  return request.put({
    url: `/dictionary/${id}/status`,
    data: { status }
  })
}

// 删除字典项
export const deleteDictionaryItem = (id: number) => {
  return request.delete({
    url: `/dictionary/${id}`
  })
}
