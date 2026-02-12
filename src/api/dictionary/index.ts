import request from '@/axios'

// 根据分类获取字典数据
export const getDictionaryByCategory = (category: string) => {
  return request.get({
    url: '/dictionary/category',
    params: { category }
  })
}

// 获取所有字典分类
export const getDictionaryCategories = () => {
  return request.get({
    url: '/dictionary/categories'
  })
}