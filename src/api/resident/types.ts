// 居民列表查询参数
export interface ResidentListParams {
  pageNum?: number
  pageSize?: number
  page?: number
  limit?: number
  name?: string
  idCard?: string
  householdHeadName?: string
  householderName?: string
  gender?: string
  villageGroup?: string
  birthYear?: string
  phone?: string
  phoneNumber?: string
  status?: string
  keyword?: string
  household_id?: string | number
  householdId?: string | number
  isHouseholdHead?: boolean | string
}

// 居民列表项（兼容 snake_case 与 camelCase）
export interface ResidentItem {
  id?: string | number
  resident_id?: string | number
  name?: string
  idCard?: string
  id_card?: string
  gender?: string
  ethnicity?: string
  nation?: string
  dateOfBirth?: string
  date_of_birth?: string
  birthDate?: string
  age?: number | string
  villageGroup?: string
  village_group?: string
  address?: string
  homeAddress?: string
  home_address?: string
  bankCard?: string
  bank_card?: string
  bankName?: string
  bank_name?: string
  phone?: string
  phoneNumber?: string
  phone_number?: string
  householdId?: string | number | null
  household_id?: string | number | null
  householdHeadId?: string | number | null
  household_head_id?: string | number | null
  householdHeadName?: string
  household_head_name?: string
  householderName?: string
  householdNumber?: string
  household_number?: string
  relationshipToHead?: string
  relationship_to_head?: string
  relation?: string
  status?: string
  equityShares?: number | string | null
  equity_shares?: number | string | null
  occupation?: string
  createTime?: string
  created_at?: string
}

// 居民列表响应
export interface ResidentListResponse extends IResponse<ResidentItem[]> {
  total?: number
  totalPersons?: number
  totalHouseholds?: number
  page?: number
  pageSize?: number
}

// 居民详情
export interface ResidentDetail extends ResidentItem {
  maritalStatus?: string
  marital_status?: string
  politicalStatus?: string
  political_status?: string
  militaryService?: string
  military_service?: string
  educationLevel?: string
  education_level?: string
  householdRegistrationStatus?: string
  household_registration_status?: string
  registeredPermanentResidence?: string | number | null
  registered_permanent_residence?: string | number | null
  registeredDate?: string | null
  registered_date?: string | null
  statusUpdatedAt?: string | null
  status_updated_at?: string | null
  statusChangeReason?: string | null
  status_change_reason?: string | null
  migrationInDate?: string | null
  migration_in_date?: string | null
  migrationInReason?: string | null
  migration_in_reason?: string | null
  migrationOutDate?: string | null
  migration_out_date?: string | null
  migrationOutReason?: string | null
  migration_out_reason?: string | null
  deathDate?: string | null
  death_date?: string | null
  deathReason?: string | null
  death_reason?: string | null
  accountCancellationDate?: string | null
  account_cancellation_date?: string | null
  remark?: string
  updateTime?: string
  updated_at?: string
}

export interface ResidentNameSuggestion {
  value: string
  label?: string
}

export interface HouseholdHeadSuggestion {
  householdNumber?: string | number
  householdHeadName?: string
  address?: string
  villageGroup?: string
  householdHeadId?: string | number
  householdType?: string
  housingType?: string
  gender?: string
  householdHeadIdCard?: string
  phoneNumber?: string
  ethnicity?: string
  value?: string
}

export interface SearchSuggestionsResponse {
  code: number
  residentNames?: ResidentNameSuggestion[]
  householdHeadNames?: HouseholdHeadSuggestion[]
}
