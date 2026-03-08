import request from '@/utils/request'

/**
 * 获取配置列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.group - 配置组
 * @param {string} params.keyword - 搜索关键字
 */
export function getConfigList(params) {
  return request({
    url: '/config',
    method: 'get',
    params
  })
}

/**
 * 获取单个配置
 * @param {string} key - 配置键
 */
export function getConfig(key) {
  return request({
    url: `/config/${key}`,
    method: 'get'
  })
}

/**
 * 批量获取配置
 * @param {Array<string>} keys - 配置键数组
 */
export function getConfigsBatch(keys) {
  return request({
    url: '/config/batch',
    method: 'post',
    data: { keys }
  })
}

/**
 * 更新单个配置
 * @param {string} key - 配置键
 * @param {string|number|boolean} value - 配置值
 */
export function updateConfig(key, value) {
  return request({
    url: `/config/${key}`,
    method: 'put',
    data: { value }
  })
}

/**
 * 批量更新配置
 * @param {Array<{key: string, value: any}>} configs - 配置数组
 */
export function updateConfigsBatch(configs) {
  return request({
    url: '/config',
    method: 'put',
    data: { configs }
  })
}

/**
 * 新增配置
 * @param {Object} data - 配置数据
 * @param {string} data.key - 配置键
 * @param {string} data.value - 配置值
 * @param {string} data.name - 配置名称
 * @param {string} data.group - 配置组
 * @param {string} data.type - 值类型
 * @param {string} data.description - 描述
 * @param {boolean} data.isSystem - 是否系统配置
 */
export function createConfig(data) {
  return request({
    url: '/config',
    method: 'post',
    data
  })
}

/**
 * 删除配置
 * @param {string} key - 配置键
 */
export function deleteConfig(key) {
  return request({
    url: `/config/${key}`,
    method: 'delete'
  })
}

/**
 * 获取所有配置组
 */
export function getConfigGroups() {
  return request({
    url: '/config/groups',
    method: 'get'
  })
}
