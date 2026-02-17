import request from '@/axios'

export interface TodoReminderQueryParams {
  page?: number
  pageSize?: number
  size?: number
  type?: string
  status?: string
  is_read?: number | ''
  keyword?: string
}

export interface TodoReminderPayload {
  title?: string
  content?: string
  type?: string
  status?: string
  progress?: number
  is_read?: number
  resident_id?: number | null
  event_id?: number | null
}

export const getTodoReminders = (params: TodoReminderQueryParams): Promise<any> => {
  return request.get({
    url: '/todo-reminders',
    params
  })
}

export const getTodoReminderStats = (): Promise<any> => {
  return request.get({
    url: '/todo-reminders/stats'
  })
}

export const getTodoReminderDetail = (id: number): Promise<any> => {
  return request.get({
    url: `/todo-reminders/${id}`
  })
}

export const createTodoReminder = (data: TodoReminderPayload): Promise<any> => {
  return request.post({
    url: '/todo-reminders',
    data
  })
}

export const updateTodoReminder = (id: number, data: TodoReminderPayload): Promise<any> => {
  return request.put({
    url: `/todo-reminders/${id}`,
    data
  })
}

export const deleteTodoReminder = (id: number): Promise<any> => {
  return request.delete({
    url: `/todo-reminders/${id}`
  })
}

export const batchDeleteTodoReminders = (ids: number[]): Promise<any> => {
  return request.post({
    url: '/todo-reminders/batch-delete',
    data: { ids }
  })
}

export const batchMarkTodoRemindersRead = (ids: number[]): Promise<any> => {
  return request.post({
    url: '/todo-reminders/mark-read',
    data: { ids }
  })
}

export const markAllTodoRemindersRead = (): Promise<any> => {
  return request.post({
    url: '/todo-reminders/mark-all-read',
    data: {}
  })
}

export const getTodoReminderUnreadCount = (): Promise<any> => {
  return request.get({
    url: '/todo-reminders/unread-count'
  })
}

export const getLatestTodoReminders = (limit = 5): Promise<any> => {
  return request.get({
    url: '/todo-reminders/latest',
    params: { limit }
  })
}
