/**
 * 请求成功状态码
 * 原项目后端返回 20000 表示成功
 */
export const SUCCESS_CODE = 20000

/**
 * 请求contentType
 */
export const CONTENT_TYPE: AxiosContentType = 'application/json'

/**
 * 请求超时时间
 */
// Increase request timeout for large imports (e.g. resident data).
export const REQUEST_TIMEOUT = 300000

/**
 * 不重定向白名单
 */
export const NO_REDIRECT_WHITE_LIST = ['/login']

/**
 * 不重置路由白名单
 */
export const NO_RESET_WHITE_LIST = ['Redirect', 'RedirectWrap', 'Login', 'NoFind', 'Root']

/**
 * 表格默认过滤列设置字段
 */
export const DEFAULT_FILTER_COLUMN = ['expand', 'selection']

/**
 * 是否根据headers->content-type自动转换数据格式
 */
export const TRANSFORM_REQUEST_DATA = true

/**
 * 全局图标前缀
 */
export const ICON_PREFIX = 'vi-'
