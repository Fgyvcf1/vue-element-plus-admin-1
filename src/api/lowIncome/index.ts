import request from '@/axios'
import type { AxiosResponse } from 'axios'

// 低收入人员类型定义（支持 snake_case 和 camelCase）
export interface LowIncomePerson {
  id?: number
  resident_id?: number
  residentId?: number
  low_income_type?: string
  lowIncomeType?: string
  approval_date?: string
  approvalDate?: string
  status?: 'active' | 'suspended' | 'cancelled'
  created_at?: string
  updated_at?: string
  // 关联居民信息
  name?: string
  idCard?: string
  id_card?: string
  gender?: string
  ethnicity?: string
  age?: number | string
  phoneNumber?: string
  phone_number?: string
  householdHeadName?: string
  household_head_name?: string
  relationshipToHead?: string
  relationship_to_head?: string
  // 政策记录相关
  enjoyPolicyType?: string
  policyType?: string
  policy_type?: string
  enjoyLevel?: string
  enjoy_level?: string
  has_subsidy?: boolean
  hasSubsidy?: boolean
  startDate?: string
  start_date?: string
  endDate?: string
  end_date?: string
  subsidyAmount?: number | string
  subsidy_amount?: number
  subsidyCycle?: string
  subsidy_cycle?: string
  accountName?: string
  account_name?: string
  accountRelationship?: string
  account_relationship?: string
  bankName?: string
  bank_name?: string
  bankAccount?: string
  bank_account?: string
  remark?: string
  // 统计字段
  totalHouseholdMembers?: number
  lowIncomeHouseholdMembers?: number
  monthlyHouseholdAmount?: number
}

// 政策记录类型定义（支持 snake_case 和 camelCase）
export interface PolicyRecord {
  id?: number
  low_income_person_id?: number
  lowIncomePersonId?: number
  policy_type?: string
  policyType?: string
  enjoy_level?: string
  enjoyLevel?: string
  has_subsidy?: boolean
  hasSubsidy?: boolean
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  subsidy_amount?: number
  subsidyAmount?: number
  subsidy_cycle?: string
  subsidyCycle?: string
  account_name?: string
  accountName?: string
  account_relationship?: string
  accountRelationship?: string
  bank_name?: string
  bankName?: string
  bank_account?: string
  bankAccount?: string
  status?: 'active' | 'expired' | 'adjusted' | 'suspended' | 'cancelled'
  remark?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

// 查询参数类型
export interface LowIncomeQueryParams {
  pageNum?: number
  pageSize?: number
  name?: string
  idCard?: string
  lowIncomeType?: string
  status?: string
}

export interface PolicyRecordQueryParams {
  low_income_person_id?: number
  pageNum?: number
  pageSize?: number
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  data: T
  message?: string
}

// 获取低收入人员列表
export const getLowIncomePersons = (
  params: LowIncomeQueryParams
): Promise<AxiosResponse<ApiResponse<LowIncomePerson[]>>> => {
  return request.get({
    url: '/low-income-persons',
    params
  })
}

// 获取单个低收入人员
export const getLowIncomePerson = (
  id: number
): Promise<AxiosResponse<ApiResponse<LowIncomePerson>>> => {
  return request.get({
    url: `/low-income-persons/${id}`
  })
}

// 添加低收入人员
export const addLowIncomePerson = (
  data: Partial<LowIncomePerson>
): Promise<AxiosResponse<ApiResponse<LowIncomePerson>>> => {
  return request.post({
    url: '/low-income-persons',
    data
  })
}

// 添加低收入人员及政策记录（事务）
export const addLowIncomePersonWithPolicy = (
  data: Partial<LowIncomePerson>
): Promise<AxiosResponse<ApiResponse<LowIncomePerson>>> => {
  return request.post({
    url: '/low-income-persons-with-policy',
    data
  })
}

// 更新低收入人员
export const updateLowIncomePerson = (
  id: number,
  data: Partial<LowIncomePerson>
): Promise<AxiosResponse<ApiResponse<LowIncomePerson>>> => {
  return request.put({
    url: `/low-income-persons/${id}`,
    data
  })
}

// 删除低收入人员
export const deleteLowIncomePerson = (id: number): Promise<AxiosResponse<ApiResponse<null>>> => {
  return request.delete({
    url: `/low-income-persons/${id}`
  })
}

// 获取政策记录列表
export const getPolicyRecords = (
  params: PolicyRecordQueryParams
): Promise<AxiosResponse<ApiResponse<PolicyRecord[]>>> => {
  return request.get({
    url: '/low-income-policy-records',
    params
  })
}

// 添加政策记录
export const addPolicyRecord = (
  data: Partial<PolicyRecord>
): Promise<AxiosResponse<ApiResponse<PolicyRecord>>> => {
  return request.post({
    url: '/low-income-policy-records',
    data
  })
}

// 更新政策记录
export const updatePolicyRecord = (
  id: number,
  data: Partial<PolicyRecord>
): Promise<AxiosResponse<ApiResponse<PolicyRecord>>> => {
  return request.put({
    url: `/low-income-policy-records/${id}`,
    data
  })
}

// 删除政策记录
export const deletePolicyRecord = (id: number): Promise<AxiosResponse<ApiResponse<null>>> => {
  return request.delete({
    url: `/low-income-policy-records/${id}`
  })
}

// 获取单个成员的历史享受政策月数
export const getTotalMonths = (
  id: number
): Promise<AxiosResponse<ApiResponse<{ totalMonths: number }>>> => {
  return request.get({
    url: `/low-income-persons/${id}/total-months`
  })
}

// 获取该户所有成员享受总金额
export const getHouseholdTotalSubsidy = (
  id: number
): Promise<AxiosResponse<ApiResponse<{ totalSubsidy: number; totalMonths: number }>>> => {
  return request.get({
    url: `/low-income-persons/${id}/household-total-subsidy`
  })
}
