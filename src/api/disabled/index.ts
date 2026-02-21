import request from '@/axios'

// 残疾人类型定义
export interface DisabledPerson {
  id?: number
  resident_id?: number | string | null
  disability_type?: string
  disability_level?: string | number
  certificate_number?: string | null
  certificate_status?: string | null
  issue_date?: string | null
  guardian_name?: string | null
  guardian_phone?: string | null
  guardian_relationship?: string | null
  created_at?: string
  updated_at?: string
  // 关联居民信息
  name?: string
  idCard?: string
  id_card?: string
  gender?: string
  age?: number | string
  phoneNumber?: string
  phone_number?: string
}

// 查询参数类型
export interface DisabledPersonQueryParams {
  pageNum?: number
  pageSize?: number
  name?: string
  idCard?: string
  disabilityType?: string
  disabilityLevel?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  data: T
  message?: string
  total?: number
}

// 获取残疾人列表
export const getDisabledPersons = (params: DisabledPersonQueryParams): Promise<any> => {
  return request.get({
    url: '/disabled-persons',
    params
  })
}

// 获取单个残疾人
export const getDisabledPerson = (id: number): Promise<any> => {
  return request.get({
    url: `/disabled-persons/${id}`
  })
}

// 新增残疾人
export const addDisabledPerson = (data: Partial<DisabledPerson>): Promise<any> => {
  return request.post({
    url: '/disabled-persons',
    data
  })
}

// 更新残疾人信息
export const updateDisabledPerson = (id: number, data: Partial<DisabledPerson>): Promise<any> => {
  return request.put({
    url: `/disabled-persons/${id}`,
    data
  })
}

// 删除残疾人信息
export const deleteDisabledPerson = (id: number): Promise<any> => {
  return request.delete({
    url: `/disabled-persons/${id}`
  })
}
