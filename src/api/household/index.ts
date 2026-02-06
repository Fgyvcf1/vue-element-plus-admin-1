import request from '@/axios'

// 获取户主详情
export const getHouseholdDetail = (id: string | number) => {
  return request.get({
    url: `/households/${id}`
  })
}

// 获取家庭成员列表
export const getHouseholdMembers = (householdId: string | number) => {
  return request.get({
    url: `/households/${householdId}/members`
  })
}

// 更新户主信息
export const updateHousehold = (id: string | number, data: any) => {
  return request.put({
    url: `/households/${id}`,
    data
  })
}

// 创建户主
export const createHousehold = (data: any) => {
  return request.post({
    url: '/households',
    data
  })
}
