export interface ResidentItem {
  id: string | number
  name: string
  idCard: string
  gender: string
  dateOfBirth: string
  age: number
  villageGroup: string
  address: string
  householdHeadName?: string
  household_head_name?: string
  relationshipToHead?: string
  relationship_to_head?: string
  phoneNumber?: string
  phone_number?: string
  bankCard?: string
  equityShares?: number
  equity_shares?: number
  status: 'active' | 'migrated_out' | 'deceased'
}

export interface ResidentListParams {
  pageNum?: number
  pageSize?: number
  name?: string
  idCard?: string
  householdHeadName?: string
  isHouseholdHead?: boolean
  gender?: string
  villageGroup?: string
  birthYear?: string
  phoneNumber?: string
  status?: string
}

export interface ResidentListResponse {
  code: number
  data: {
    data: ResidentItem[]
    total: number
    totalHouseholds: number
    totalPersons: number
  }
  message?: string
}

export interface SearchSuggestionParams {
  keyword: string
  type: 'residentNames' | 'householdHeadNames'
}

export interface SearchSuggestionResponse {
  code: number
  residentNames?: { value: string }[]
  householdHeadNames?: { value: string }[]
  message?: string
}
