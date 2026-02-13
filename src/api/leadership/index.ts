import request from '@/axios'

export interface CommitteeMemberQueryParams {
  organization_type?: string
  term_number?: string | number | null
  status?: 'current' | 'history' | string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface CommitteeMemberPayload {
  residentId?: number
  resident_id?: number
  organizationType?: string
  organization_type?: string
  termNumber?: string | number
  term_number?: string | number
  termStartDate?: string
  term_start_date?: string
  termEndDate?: string | null
  term_end_date?: string | null
  position?: string
  status?: string
  remarks?: string
}

export const getCommitteeMembers = (params: CommitteeMemberQueryParams): Promise<any> => {
  return request.get({
    url: '/committee-members',
    params
  })
}

export const getCommitteeMember = (id: number): Promise<any> => {
  return request.get({
    url: `/committee-members/${id}`
  })
}

export const addCommitteeMember = (data: CommitteeMemberPayload): Promise<any> => {
  return request.post({
    url: '/committee-members',
    data
  })
}

export const updateCommitteeMember = (id: number, data: CommitteeMemberPayload): Promise<any> => {
  return request.put({
    url: `/committee-members/${id}`,
    data
  })
}

export const deleteCommitteeMember = (id: number): Promise<any> => {
  return request.delete({
    url: `/committee-members/${id}`
  })
}

export const getTermNumbers = (organizationType: string): Promise<any> => {
  return request.get({
    url: '/committee-members/term-numbers',
    params: { organization_type: organizationType }
  })
}

export const getMemberHistory = (residentId: number): Promise<any> => {
  return request.get({
    url: '/committee-members/history',
    params: { resident_id: residentId }
  })
}

export const getMemberStatistics = (residentId: number): Promise<any> => {
  return request.get({
    url: '/committee-members/statistics',
    params: { resident_id: residentId }
  })
}

