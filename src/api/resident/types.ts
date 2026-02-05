// 居民列表查询参数
export interface ResidentListParams {
  page: number
  limit: number
  name?: string
  idCard?: string
  householderName?: string
  gender?: string
  villageGroup?: string
  birthYear?: string
  phone?: string
  status?: string
}

// 居民列表结果
export interface ResidentListResult {
  list: ResidentItem[]
  total: number
  households: number
}

// 居民列表项
export interface ResidentItem {
  id: string
  name: string
  gender: string
  idCard: string
  birthDate: string
  villageGroup: string
  address: string
  phone: string
  householderName: string
  relation: string
  status: string
  nation?: string
  createTime?: string
}

// 居民详情
export interface ResidentDetail {
  id: string
  name: string
  gender: string
  idCard: string
  birthDate: string
  nation: string
  villageGroup: string
  address: string
  phone: string
  householderName: string
  relation: string
  status: string
  createTime: string
  updateTime?: string
  remark?: string
}
