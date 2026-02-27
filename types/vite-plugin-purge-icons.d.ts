declare module 'vite-plugin-purge-icons' {
  import type { Plugin } from 'vite'

  const plugin: (options?: Record<string, unknown>) => Plugin | Plugin[]
  export default plugin
}
