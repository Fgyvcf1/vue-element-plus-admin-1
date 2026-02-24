const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.resolve(__dirname, '..')
const ROUTER_DIR = path.join(ROOT_DIR, 'src', 'router', 'modules')
const ROUTER_INDEX = path.join(ROOT_DIR, 'src', 'router', 'index.ts')
const LOCALE_ZH = path.join(ROOT_DIR, 'src', 'locales', 'zh-CN.ts')
const OUTPUT_DIR = path.join(ROOT_DIR, 'backend', 'seed')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sys_menu.json')

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8')

const getStringLiteral = (node) => {
  if (!node) return null
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  return null
}

const getBooleanLiteral = (node) => {
  if (!node) return null
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  return null
}

const getNumberLiteral = (node) => {
  if (!node) return null
  if (ts.isNumericLiteral(node)) return Number(node.text)
  return null
}

const parseLocaleRouter = () => {
  if (!fs.existsSync(LOCALE_ZH)) return {}
  const source = ts.createSourceFile(LOCALE_ZH, readFile(LOCALE_ZH), ts.ScriptTarget.Latest, true)
  let routerNode = null

  source.forEachChild((node) => {
    if (ts.isExportAssignment(node) && ts.isObjectLiteralExpression(node.expression)) {
      node.expression.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop) && prop.name && prop.name.getText() === 'router') {
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            routerNode = prop.initializer
          }
        }
      })
    }
  })

  const result = {}
  if (!routerNode) return result

  routerNode.properties.forEach((prop) => {
    if (!ts.isPropertyAssignment(prop)) return
    const key = prop.name.getText().replace(/^['"]|['"]$/g, '')
    const value = getStringLiteral(prop.initializer)
    if (value !== null) {
      result[`router.${key}`] = value
    }
  })

  return result
}

const parseMeta = (node, localeMap) => {
  if (!ts.isObjectLiteralExpression(node)) return {}
  const meta = {}
  node.properties.forEach((prop) => {
    if (!ts.isPropertyAssignment(prop)) return
    const key = prop.name.getText().replace(/^['"]|['"]$/g, '')
    const init = prop.initializer

    if (key === 'title') {
      const literal = getStringLiteral(init)
      if (literal) {
        meta.title = literal
        return
      }
      if (ts.isCallExpression(init) && ts.isIdentifier(init.expression) && init.expression.text === 't') {
        const arg = init.arguments[0]
        const k = getStringLiteral(arg)
        if (k) {
          meta.title = localeMap[k] || k
        }
      }
      return
    }

    if (key === 'icon') {
      const literal = getStringLiteral(init)
      if (literal) meta.icon = literal
      return
    }

    if (key === 'permission') {
      const literal = getStringLiteral(init)
      if (literal) meta.permission = literal
      return
    }

    if (key === 'hidden') {
      const bool = getBooleanLiteral(init)
      if (bool !== null) meta.hidden = bool
      return
    }

    if (key === 'alwaysShow') {
      const bool = getBooleanLiteral(init)
      if (bool !== null) meta.alwaysShow = bool
      return
    }

    if (key === 'noCache') {
      const bool = getBooleanLiteral(init)
      if (bool !== null) meta.noCache = bool
      return
    }

    if (key === 'affix') {
      const bool = getBooleanLiteral(init)
      if (bool !== null) meta.affix = bool
      return
    }

    if (key === 'activeMenu') {
      const literal = getStringLiteral(init)
      if (literal) meta.activeMenu = literal
      return
    }

    if (key === 'orderNo') {
      const num = getNumberLiteral(init)
      if (num !== null) meta.orderNo = num
    }
  })
  return meta
}

const parseComponent = (node) => {
  if (!node) return null
  if (ts.isIdentifier(node) && node.text === 'Layout') return '#'
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text

  if (ts.isArrowFunction(node)) {
    const body = node.body
    if (ts.isCallExpression(body) && body.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = body.arguments[0]
      const literal = getStringLiteral(arg)
      if (literal) {
        return literal
          .replace(/^@\//, '')
          .replace(/^src\//, '')
          .replace(/\.(vue|tsx?)$/, '')
      }
    }
  }

  return null
}

const parseRouteObject = (node, localeMap) => {
  if (!ts.isObjectLiteralExpression(node)) return null

  const route = {
    path: '',
    name: '',
    redirect: '',
    component: null,
    meta: {},
    children: []
  }

  node.properties.forEach((prop) => {
    if (!ts.isPropertyAssignment(prop)) return
    const key = prop.name.getText().replace(/^['"]|['"]$/g, '')
    const init = prop.initializer

    if (key === 'path') {
      route.path = getStringLiteral(init) || ''
      return
    }

    if (key === 'name') {
      route.name = getStringLiteral(init) || ''
      return
    }

    if (key === 'redirect') {
      route.redirect = getStringLiteral(init) || ''
      return
    }

    if (key === 'component') {
      route.component = parseComponent(init)
      return
    }

    if (key === 'meta') {
      route.meta = parseMeta(init, localeMap)
      return
    }

    if (key === 'children' && ts.isArrayLiteralExpression(init)) {
      route.children = init.elements
        .map((el) => parseRouteObject(el, localeMap))
        .filter(Boolean)
      return
    }
  })

  return route
}

const extractRoutesFromFile = (filePath, localeMap, variableName) => {
  const source = ts.createSourceFile(filePath, readFile(filePath), ts.ScriptTarget.Latest, true)
  const routes = []

  const handleArray = (arrayNode) => {
    arrayNode.elements.forEach((el) => {
      if (ts.isObjectLiteralExpression(el)) {
        const route = parseRouteObject(el, localeMap)
        if (route) routes.push(route)
      }
    })
  }

  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return
    node.declarationList.declarations.forEach((decl) => {
      if (!decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) return
      const name = decl.name.getText()
      if (variableName && name !== variableName) return
      if (!variableName && !name.endsWith('Router')) return
      handleArray(decl.initializer)
    })
  })

  return routes
}

const collectRoutes = () => {
  const localeMap = parseLocaleRouter()
  const moduleFiles = fs
    .readdirSync(ROUTER_DIR)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.join(ROUTER_DIR, file))

  const moduleRoutes = moduleFiles.flatMap((file) => extractRoutesFromFile(file, localeMap))
  const indexRoutes = extractRoutesFromFile(ROUTER_INDEX, localeMap, 'asyncRouterMap')

  return [...indexRoutes, ...moduleRoutes].filter((route) => route && route.name && route.path !== undefined)
}

const buildMenuRows = (routes) => {
  let idCounter = 1
  const rows = []

  const walk = (items, parentId) => {
    items.forEach((route, index) => {
      const meta = route.meta || {}
      const menuType = route.children && route.children.length ? 1 : 2
      const sortOrder = meta.orderNo ?? index + 1
      const title = meta.title || route.name
      const id = idCounter++

      rows.push({
        id,
        parent_id: parentId,
        name: route.name,
        path: route.path || '',
        component: route.component || '#',
        redirect: route.redirect || null,
        title,
        icon: meta.icon || null,
        menu_type: menuType,
        permission_code: meta.permission || null,
        sort_order: sortOrder,
        hidden: meta.hidden ? 1 : 0,
        always_show: meta.alwaysShow ? 1 : 0,
        no_cache: meta.noCache ? 1 : 0,
        affix: meta.affix ? 1 : 0,
        active_menu: meta.activeMenu || null,
        status: 1
      })

      if (route.children && route.children.length) {
        walk(route.children, id)
      }
    })
  }

  walk(routes, 0)
  return rows
}

const main = () => {
  const routes = collectRoutes()
  const rows = buildMenuRows(routes)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2), 'utf8')
  console.log(`✅ sys_menu seed generated: ${OUTPUT_FILE} (${rows.length} rows)`)
}

main()
