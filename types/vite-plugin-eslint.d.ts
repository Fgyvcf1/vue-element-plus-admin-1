declare module 'vite-plugin-eslint' {
  import type { Plugin } from 'vite'

  const plugin: (options?: Record<string, unknown>) => Plugin | Plugin[]
  export default plugin
}
