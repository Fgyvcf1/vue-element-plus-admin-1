import { defineStore } from 'pinia'
import { store } from '../index'
import { getCommitteeMembers, getTermNumbers } from '@/api/leadership'

interface LeadershipState {
  members: any[]
  total: number
  loading: boolean
  currentOrgType: string
  currentTerm: string | number | null
  termOptions: any[]
  filters: {
    organizationType: string
    status: string
  }
}

export const useLeadershipStore = defineStore('leadership', {
  state: (): LeadershipState => ({
    members: [],
    total: 0,
    loading: false,
    currentOrgType: 'branch_committee',
    currentTerm: null,
    termOptions: [],
    filters: {
      organizationType: 'branch_committee',
      status: 'current'
    }
  }),
  getters: {
    getMembers(): any[] {
      return this.members
    },
    getTotal(): number {
      return this.total
    },
    getLoading(): boolean {
      return this.loading
    },
    getTermOptions(): any[] {
      return this.termOptions
    }
  },
  actions: {
    setMembers(members: any[]) {
      this.members = members
    },
    setTotal(total: number) {
      this.total = total
    },
    setLoading(loading: boolean) {
      this.loading = loading
    },
    setCurrentOrgType(type: string) {
      this.currentOrgType = type
      this.filters.organizationType = type
    },
    setCurrentTerm(term: string | number | null) {
      this.currentTerm = term
    },
    setTermOptions(options: any[]) {
      this.termOptions = options
    },
    setFilters(filters: Partial<LeadershipState['filters']>) {
      this.filters = { ...this.filters, ...filters }
    },
    async fetchMembers(params: Record<string, any> = {}) {
      this.setLoading(true)
      try {
        const response = await getCommitteeMembers({
          organization_type: this.filters.organizationType,
          term_number: this.currentTerm,
          status: this.filters.status,
          ...params
        })
        this.setMembers(response.data || [])
        this.setTotal(response.total || 0)
        return response
      } finally {
        this.setLoading(false)
      }
    },
    async fetchTermNumbers(orgType: string) {
      const response = await getTermNumbers(orgType)
      this.setTermOptions(response?.data || [])
      return response
    }
  }
})

export const useLeadershipStoreWithOut = () => {
  return useLeadershipStore(store)
}
