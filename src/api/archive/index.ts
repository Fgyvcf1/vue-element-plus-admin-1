import request from '@/axios'

export interface ArchiveQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  prefix?: string
}

export interface Archive {
  id?: number
  archive_id?: string
  prefix?: string
  sequence_number?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export interface ArchivePrefix {
  prefix: string
  sequence_number: number
}

export interface Application {
  id?: number
  archive_id?: string
  dispute_type?: string
  dispute_description?: string
  applicant_name?: string
  applicant_gender?: string
  applicant_id_card?: string
  applicant_phone?: string
  applicant_address?: string
  respondent_name?: string
  respondent_gender?: string
  respondent_id_card?: string
  respondent_phone?: string
  respondent_address?: string
  created_at?: string
}

export interface Record {
  id?: number
  archive_id?: string
  mediation_date?: string
  mediation_location?: string
  mediators?: string
  process_record?: string
  mediation_result?: string
  agreement?: string
  created_at?: string
}

export interface Agreement {
  id?: number
  archive_id?: string
  agreement_content?: string
  performance_period?: string
  breach_liability?: string
  created_at?: string
}

export interface Attachment {
  id?: number
  archive_id?: string
  file_name?: string
  file_path?: string
  file_type?: string
  file_size?: number
  created_at?: string
}

export const getArchives = (params: ArchiveQueryParams): Promise<any> => {
  return request.get({ url: '/archives', params })
}

export const getArchivePrefixes = (): Promise<any> => {
  return request.get({ url: '/archives/prefixes' })
}

export const addArchivePrefix = (data: ArchivePrefix): Promise<any> => {
  return request.post({ url: '/archives/prefixes', data })
}

export const deleteArchivePrefix = (prefix: string): Promise<any> => {
  return request.delete({ url: `/archives/prefixes/${prefix}` })
}

export const createArchive = (data: Archive): Promise<any> => {
  return request.post({ url: '/archives', data })
}

export const getArchiveDetail = (id: string | number): Promise<any> => {
  return request.get({ url: `/archives/${id}` })
}

export const deleteArchive = (id: string | number): Promise<any> => {
  return request.delete({ url: `/archives/${id}` })
}

export const saveApplication = (id: string | number, data: Application): Promise<any> => {
  return request.post({ url: `/archives/${id}/application`, data })
}

export const saveRecord = (id: string | number, data: Record): Promise<any> => {
  return request.post({ url: `/archives/${id}/records`, data })
}

export const saveAgreement = (id: string | number, data: Agreement): Promise<any> => {
  return request.post({ url: `/archives/${id}/agreement`, data })
}

export const generateApplicationPDF = (id: string | number): Promise<any> => {
  return request.post({ url: `/archives/${id}/generate-pdf/application`, data: {} })
}

export const generateRecordPDF = (id: string | number): Promise<any> => {
  return request.post({ url: `/archives/${id}/generate-pdf/record`, data: {} })
}

export const generateAgreementPDF = (id: string | number): Promise<any> => {
  return request.post({ url: `/archives/${id}/generate-pdf/agreement`, data: {} })
}

export const getAttachments = (id: string | number): Promise<any> => {
  return request.get({ url: `/archives/${id}/attachments` })
}

export const uploadAttachment = (id: string | number, formData: FormData): Promise<any> => {
  return request.post({
    url: `/archives/${id}/attachments`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const deleteAttachment = (id: string | number, attachmentId: number): Promise<any> => {
  return request.delete({ url: `/archives/${id}/attachments/${attachmentId}` })
}

// 上传调解记录图片
export const uploadRecordImages = (id: string | number, formData: FormData): Promise<any> => {
  return request.post({
    url: `/archives/${id}/records/images`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 生成调解案卷PDF
export const generateCaseFile = (id: string | number): Promise<any> => {
  return request.post({ url: `/archives/${id}/generate-casefile`, data: {} })
}

// 下载档案打包
export const downloadArchive = (id: string | number): Promise<any> => {
  return request.get({
    url: `/archives/${id}/download`,
    responseType: 'blob'
  })
}

// 下载PDF文件
export const downloadPDF = (filename: string): Promise<any> => {
  return request.get({
    url: `/archives/pdf/${filename}`,
    responseType: 'blob'
  })
}

export const getArchiveStatusStats = (): Promise<any> => {
  return request.get({ url: '/archives/status-stats' })
}

export const getMediationMonthlyStats = (): Promise<any> => {
  return request.get({ url: '/archives/mediation-monthly-stats' })
}

// 获取案卷列表
export const getCaseFileList = (params: {
  page?: number
  pageSize?: number
  keyword?: string
}): Promise<any> => {
  return request.get({ url: '/case-files', params })
}

// 下载案卷文件
export const downloadCaseFile = (archiveId: string): Promise<any> => {
  return request.get({
    url: `/case-files/${archiveId}/download`,
    responseType: 'blob'
  })
}
