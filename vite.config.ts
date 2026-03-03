import { resolve } from 'path'
import { loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import progress from 'vite-plugin-progress'
import EslintPlugin from 'vite-plugin-eslint'
import { ViteEjsPlugin } from 'vite-plugin-ejs'
import { viteMockServe } from 'vite-plugin-mock'
import PurgeIcons from 'vite-plugin-purge-icons'
import ServerUrlCopy from 'vite-plugin-url-copy'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
const root = process.cwd()

function pathResolve(dir: string) {
  return resolve(root, '.', dir)
}

export default ({ command, mode }: ConfigEnv): UserConfig => {
  const iconifyCollectionRe =
    /(?:material-symbols|material-symbols-light|ic|mdi|ph|solar|tabler|mingcute|ri|bi|carbon|iconamoon|iconoir|ion|lucide|uil|tdesign|teenyicons|clarity|bx|bxs|majesticons|ant-design|gg|octicon|memory|cil|mynaui|basil|pixelarticons|akar-icons|ci|system-uicons|typcn|radix-icons|zondicons|ep|circum|mdi-light|fe|eos-icons|charm|prime|humbleicons|uiw|uim|uit|uis|maki|gridicons|mi|quill|gala|lets-icons|fluent|icon-park-outline|icon-park-solid|icon-park-twotone|icon-park|vscode-icons|jam|heroicons|codicon|pajamas|pepicons-pop|pepicons-print|pepicons-pencil|bytesize|ei|streamline|guidance|fa6-solid|fa6-regular|ooui|nimbus|formkit|line-md|meteocons|svg-spinners|openmoji|twemoji|noto|fluent-emoji|fluent-emoji-flat|fluent-emoji-high-contrast|noto-v1|emojione|emojione-monotone|emojione-v1|fxemoji|streamline-emojis|bxl|logos|simple-icons|cib|fa6-brands|nonicons|arcticons|file-icons|devicon|devicon-plain|skill-icons|brandico|entypo-social|cryptocurrency|cryptocurrency-color|flag|circle-flags|flagpack|cif|gis|map|geo|game-icons|fad|academicons|wi|healthicons|medical-icon|covid|la|eva|dashicons|flat-color-icons|entypo|foundation|raphael|icons8|iwwa|heroicons-outline|heroicons-solid|fa-solid|fa-regular|fa-brands|fa|fluent-mdl2|fontisto|icomoon-free|subway|oi|wpf|simple-line-icons|et|el|vaadin|grommet-icons|whh|si-glyph|zmdi|ls|bpmn|flat-ui|vs|topcoat|il|websymbol|fontelico|ps|feather|mono-icons|pepicons):[\w\d-]+/g
  const iconifyCollectionCheckRe =
    /(?:material-symbols|material-symbols-light|ic|mdi|ph|solar|tabler|mingcute|ri|bi|carbon|iconamoon|iconoir|ion|lucide|uil|tdesign|teenyicons|clarity|bx|bxs|majesticons|ant-design|gg|octicon|memory|cil|mynaui|basil|pixelarticons|akar-icons|ci|system-uicons|typcn|radix-icons|zondicons|ep|circum|mdi-light|fe|eos-icons|charm|prime|humbleicons|uiw|uim|uit|uis|maki|gridicons|mi|quill|gala|lets-icons|fluent|icon-park-outline|icon-park-solid|icon-park-twotone|icon-park|vscode-icons|jam|heroicons|codicon|pajamas|pepicons-pop|pepicons-print|pepicons-pencil|bytesize|ei|streamline|guidance|fa6-solid|fa6-regular|ooui|nimbus|formkit|line-md|meteocons|svg-spinners|openmoji|twemoji|noto|fluent-emoji|fluent-emoji-flat|fluent-emoji-high-contrast|noto-v1|emojione|emojione-monotone|emojione-v1|fxemoji|streamline-emojis|bxl|logos|simple-icons|cib|fa6-brands|nonicons|arcticons|file-icons|devicon|devicon-plain|skill-icons|brandico|entypo-social|cryptocurrency|cryptocurrency-color|flag|circle-flags|flagpack|cif|gis|map|geo|game-icons|fad|academicons|wi|healthicons|medical-icon|covid|la|eva|dashicons|flat-color-icons|entypo|foundation|raphael|icons8|iwwa|heroicons-outline|heroicons-solid|fa-solid|fa-regular|fa-brands|fa|fluent-mdl2|fontisto|icomoon-free|subway|oi|wpf|simple-line-icons|et|el|vaadin|grommet-icons|whh|si-glyph|zmdi|ls|bpmn|flat-ui|vs|topcoat|il|websymbol|fontelico|ps|feather|mono-icons|pepicons):[\w\d-]+/
  let env = {} as any
  const isBuild = command === 'build'

  if (!isBuild) {
    env = loadEnv(process.argv[3] === '--mode' ? process.argv[4] : process.argv[3], root)
  } else {
    env = loadEnv(mode, root)
  }

  // 判断是否为开发环境，用于决定是否启用某些插件
  const isDevelopment = !isBuild;
  const useOnlineIcon = env.VITE_USE_ONLINE_ICON === 'true'

  return {
    base: env.VITE_BASE_PATH,
    plugins: [
      Vue({
        script: {
          // 寮€鍚痙efineModel
          defineModel: true
        }
      }),
      VueJsx(),
      ServerUrlCopy(),
      isDevelopment && env.VITE_SHOW_PROGRESS !== 'false' ? progress() : undefined,
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      }),
      !isBuild && env.VITE_DISABLE_ESLINT !== 'true'
        ? EslintPlugin({
            cache: false,
            failOnWarning: false,
            failOnError: false,
            include: ['src/**/*.vue', 'src/**/*.ts', 'src/**/*.tsx'] // 妫€鏌ョ殑鏂囦欢
          })
        : undefined,
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        include: [resolve(__dirname, 'src/locales/**')]
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve('src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: true
      }),
      // 仅在生产环境或需要时启用 PurgeIcons 插件
      (isBuild || env.VITE_DISABLE_PURGE_ICONS !== 'true') && !useOnlineIcon
        ? PurgeIcons({
            content: ['src/**/*.{vue,ts,tsx,js,jsx}'],
            iconifyImportName: '@/plugins/iconify-offline',
            iconSource: 'local',
            extractors: [
              {
                extensions: ['*'],
                extractor: (code: string) => {
                  const results = new Set(code.match(iconifyCollectionRe) || [])
                  const viMatches = code.match(/vi-[\w-]+:[\w-]+/g) || []
                  viMatches.forEach((icon: string) => {
                    const normalized = icon.replace(/^vi-/, '')
                    if (iconifyCollectionCheckRe.test(normalized)) {
                      results.add(normalized)
                    }
                  })
                  return Array.from(results)
                }
              }
            ]
          })
        : undefined,
      env.VITE_USE_MOCK === 'true'
        ? viteMockServe({
            ignore: /^\_/,
            mockPath: 'mock',
            localEnabled: !isBuild,
            prodEnabled: isBuild,
            injectCode: `
          import { setupProdMockServer } from '../mock/_createProductionServer'

          setupProdMockServer()
          `
          })
        : undefined,
      ViteEjsPlugin({
        title: env.VITE_APP_TITLE
      }),
      UnoCSS()
    ],

    css: {
      preprocessorOptions: {
        less: {
          additionalData: '@import "./src/styles/variables.module.less";',
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.less', '.css'],
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js'
        },
        {
          find: '@',
          replacement: `${pathResolve('src')}/`
        }
      ]
    },
    esbuild: {
      pure: env.VITE_DROP_CONSOLE === 'true' ? ['console.log'] : undefined,
      drop: env.VITE_DROP_DEBUGGER === 'true' ? ['debugger'] : undefined
    },
    build: {
      target: 'es2015',
      outDir: env.VITE_OUT_DIR || 'dist',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      // brotliSize: false,
      rollupOptions: {
        plugins: env.VITE_USE_BUNDLE_ANALYZER === 'true' ? [visualizer()] : undefined,
        // 鎷嗗寘
        output: {
          manualChunks: {
            'vue-chunks': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
            'element-plus': ['element-plus'],
            'wang-editor': ['@wangeditor/editor', '@wangeditor/editor-for-vue'],
            'echarts': ['echarts', 'echarts-wordcloud']
          }
        }
      },
      cssCodeSplit: !(env.VITE_USE_CSS_SPLIT === 'false'),
      cssTarget: ['chrome31']
    },
    server: {
      port: 4000,
      strictPort: true, // Fail if port is already in use.
      watch: {
        // Avoid watching build output on Windows.
        ignored: ['**/release/**', '**/dist/**', '**/dist-pro/**']
      },
      proxy: {
        // Exclude mock paths from proxy.
        '/api': {
          target: 'http://localhost:3002', // 更新端口为3002，与后端配置一致
          changeOrigin: true,
          bypass: (req) => {
            // Let vite-plugin-mock handle mock paths.
            if (req.url?.startsWith('/api/mock')) {
              return req.url
            }
          }
        },
        '/uploads': {
          target: 'http://localhost:3002', // 更新端口为3002，与后端配置一致
          changeOrigin: true
        }
      },
      hmr: {
        overlay: false
      },
      host: '0.0.0.0'
    },
    optimizeDeps: {
      entries: ['index.html', 'src/main.ts'],
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vue-i18n',
        'element-plus',
        'element-plus/es/locale/lang/zh-cn',
        'element-plus/es/locale/lang/en',
        '@element-plus/icons-vue',
        '@vueuse/core',
        'axios',
        'qs',
        'dayjs'
      ],
      exclude: ['backend']
    }
  }
}
