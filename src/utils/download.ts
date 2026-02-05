/**
 * 下载文件
 * @param data 文件数据 (Blob)
 * @param filename 文件名
 */
export const downloadFile = (data: Blob, filename: string) => {
  const blob = new Blob([data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * 根据URL下载文件
 * @param url 文件URL
 * @param filename 文件名
 */
export const downloadByUrl = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
