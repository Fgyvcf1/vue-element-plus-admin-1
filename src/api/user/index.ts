import request from '@/axios'

export const getProfile = () => {
  return request.get({ url: '/user/profile' })
}

export const updateProfile = (data: {
  realName?: string
  phoneNumber?: string
  email?: string
  avatarUrl?: string
}) => {
  return request.put({ url: '/user/profile', data })
}
