import request from '@/axios'

// 角色管理
export const getRoles = () => {
  return request.get({ url: '/permission/roles' })
}

export const getRoleById = (id: number) => {
  return request.get({ url: `/permission/roles/${id}` })
}

export const createRole = (data: any) => {
  return request.post({ url: '/permission/roles', data })
}

export const updateRole = (id: number, data: any) => {
  return request.put({ url: `/permission/roles/${id}`, data })
}

export const deleteRole = (id: number) => {
  return request.delete({ url: `/permission/roles/${id}` })
}

// 权限管理
export const getPermissions = () => {
  return request.get({ url: '/permission/permissions' })
}

export const getPermissionsByModule = () => {
  return request.get({ url: '/permission/permissions/by-module' })
}

// 用户管理
export const getUsers = () => {
  return request.get({ url: '/permission/users' })
}

export const createUser = (data: any) => {
  return request.post({ url: '/permission/users', data })
}

export const updateUser = (id: number, data: any) => {
  return request.put({ url: `/permission/users/${id}`, data })
}

export const deleteUser = (id: number) => {
  return request.delete({ url: `/permission/users/${id}` })
}

export const resetUserPassword = (id: number, newPassword: string) => {
  return request.put({ url: `/permission/users/${id}/reset-password`, data: { newPassword } })
}

export const getUserPermissions = (userId: number) => {
  return request.get({ url: `/permission/users/${userId}/permissions` })
}

export const assignUserRole = (userId: number, roleId: number) => {
  return request.put({ url: `/permission/users/${userId}/role`, data: { roleId } })
}

// 获取当前用户的权限 + 菜单树
export const getMyPermission = () => {
  return request.get({ url: '/permission/me' })
}
