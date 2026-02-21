export interface UserLoginType {
  username: string
  password: string
  role?: string
}

export interface UserType {
  id?: number | string
  username: string
  password?: string
  realName?: string
  token?: string
  role?: string
  roleId?: string | number
  roleName?: string
  permissions?: string[]
  phoneNumber?: string
}
