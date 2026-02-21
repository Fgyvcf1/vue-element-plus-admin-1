import request from '@/axios'

// 低收入人员类型定义（支持 snake_case 和 camelCase）
export interface LowIncomePerson {
  id?: number
  resident_id?: number | string | null
  residentId?: number | string | null
  low_income_type?: string | null
  lowIncomeType?: string | null
  approval_date?: string | null
  approvalDate?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
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
  dateOfBirth?: string
  date_of_birth?: string
  householdId?: string | number | null
  household_id?: string | number | null
  // 政策记录相关
  enjoyPolicyType?: string
  policyType?: string | null
  policy_type?: string | null
  enjoyLevel?: string | null
  enjoy_level?: string | null
  has_subsidy?: boolean | null
  hasSubsidy?: boolean | null
  startDate?: string | null
  start_date?: string | null
  endDate?: string | null
  end_date?: string | null
  subsidyAmount?: number | string | null
  subsidy_amount?: number | string | null
  subsidyCycle?: string | null
  subsidy_cycle?: string | null
  subsidyAccount?: string | null
  accountName?: string | null
  account_name?: string | null
  accountRelationship?: string | null
  account_relationship?: string | null
  accountHolderRelationship?: string | null
  bankName?: string | null
  bank_name?: string | null
  bankAccount?: string | null
  bank_account?: string | null
  remark?: string | null
  // 统计字段
  totalHouseholdMembers?: number
  lowIncomeHouseholdMembers?: number
  monthlyHouseholdAmount?: number
}

// 政策记录类型定义（支持 snake_case 和 camelCase）
export interface PolicyRecord {
  id?: number
  low_income_person_id?: number | string | null
  lowIncomePersonId?: number | string | null
  policy_type?: string | null
  policyType?: string | null
  enjoy_level?: string | null
  enjoyLevel?: string | null
  has_subsidy?: boolean | null
  hasSubsidy?: boolean | null
  start_date?: string | null
  startDate?: string | null
  end_date?: string | null
  endDate?: string | null
  subsidy_amount?: number | string | null
  subsidyAmount?: number | string | null
  subsidy_cycle?: string | null
  subsidyCycle?: string | null
  subsidyAccount?: string | null
  account_name?: string | null
  accountName?: string | null
  account_relationship?: string | null
  accountRelationship?: string | null
  accountHolderRelationship?: string | null
  bank_name?: string | null
  bankName?: string | null
  bank_account?: string | null
  bankAccount?: string | null
  status?: string | null
  remark?: string | null
  created_at?: string | null
  createdAt?: string | null
  updated_at?: string | null
  updatedAt?: string | null
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

// 列表响应类型
export interface PagedResponse<T = any> extends IResponse<T> {
  total?: number
  page?: number
  pageSize?: number
}

// 获取低收入人员列表
export const getLowIncomePersons = (
  params: LowIncomeQueryParams
): Promise<PagedResponse<LowIncomePerson[]>> => {
  return request.get({
    url: '/low-income-persons',
    params
  })
}

// 获取单个低收入人员
export const getLowIncomePerson = (
  id: number
): Promise<IResponse<LowIncomePerson>> => {
  return request.get({
    url: `/low-income-persons/${id}`
  })
}

// 添加低收入人员
export const addLowIncomePerson = (
  data: Partial<LowIncomePerson>
): Promise<IResponse<{ id: number }>> => {
  return request.post({
    url: '/low-income-persons',
    data
  })
}

// 添加低收入人员及政策记录（事务）
export const addLowIncomePersonWithPolicy = (
  data: Partial<LowIncomePerson>
): Promise<IResponse<{ id: number }>> => {
  return request.post({
    url: '/low-income-persons-with-policy',
    data
  })
}

// 更新低收入人员
export const updateLowIncomePerson = (
  id: number,
  data: Partial<LowIncomePerson>
): Promise<IResponse<null>> => {
  return request.put({
    url: `/low-income-persons/${id}`,
    data
  })
}

// 删除低收入人员
export const deleteLowIncomePerson = (id: number): Promise<IResponse<null>> => {
  return request.delete({
    url: `/low-income-persons/${id}`
  })
}

// 获取政策记录列表
export const getPolicyRecords = (
  params: PolicyRecordQueryParams
): Promise<PagedResponse<PolicyRecord[]>> => {
  return request.get({
    url: '/low-income-policy-records',
    params
  })
}

// 添加政策记录
export const addPolicyRecord = (
  data: Partial<PolicyRecord>
): Promise<IResponse<{ id: number }>> => {
  return request.post({
    url: '/low-income-policy-records',
    data
  })
}

// 更新政策记录
export const updatePolicyRecord = (
  id: number,
  data: Partial<PolicyRecord>
): Promise<IResponse<null>> => {
  return request.put({
    url: `/low-income-policy-records/${id}`,
    data
  })
}

// 删除政策记录
export const deletePolicyRecord = (id: number): Promise<IResponse<null>> => {
  return request.delete({
    url: `/low-income-policy-records/${id}`
  })
}

// 获取单个成员的历史享受政策月数
export const getTotalMonths = (
  id: number
): Promise<IResponse<{ totalMonths: number }>> => {
  return request.get({
    url: `/low-income-persons/${id}/total-months`
  })
}

// 获取该户所有成员享受总金额
export const getHouseholdTotalSubsidy = (
  id: number
): Promise<IResponse<{ totalSubsidy: number; totalMonths: number }>> => {
  return request.get({
    url: `/low-income-persons/${id}/household-total-subsidy`
  })
}
