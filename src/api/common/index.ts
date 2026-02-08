import request from '@/axios'

// 获取所有字典（按分类组织）
export const getDictApi = () => {
  return request.get({ url: '/dictionaries' })
}

// 根据分类获取字典项
export const getDictByCategoryApi = (category: string) => {
  return request.get({ url: '/dictionaries', params: { category } })
}

// 获取字典分类列表
export const getDictCategoriesApi = () => {
  return request.get({ url: '/dictionaries/categories' })
}
