const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const db = require('./db')

const ROOT_DIR = path.resolve(__dirname, '..')
const ROUTER_DIR = path.join(ROOT_DIR, 'src', 'router', 'modules')
const ROUTER_INDEX = path.join(ROOT_DIR, 'src', 'router', 'index.ts')
const LOCALE_ZH = path.join(ROOT_DIR, 'src', 'locales', 'zh-CN.ts')

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
        const normalized = literal
          .replace(/^@\//, '')
          .replace(/^src\//, '')
          .replace(/\.(vue|tsx?)$/, '')
        return normalized
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

const flattenRoutes = (routes) => {
  return routes.filter((route) => route && route.name && route.path)
}

const insertMenuTree = async (routes, parentId = 0) => {
  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index]
    const meta = route.meta || {}
    const menuType = route.children && route.children.length ? 1 : 2
    const sortOrder = meta.orderNo || index + 1
    const title = meta.title || route.name

    const [result] = await db.pool.execute(
      `INSERT INTO sys_menu
       (parent_id, name, path, component, redirect, title, icon, menu_type, permission_code, sort_order,
        hidden, always_show, no_cache, affix, active_menu, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parentId,
        route.name,
        route.path || '',
        route.component || '#',
        route.redirect || null,
        title,
        meta.icon || null,
        menuType,
        meta.permission || null,
        sortOrder,
        meta.hidden ? 1 : 0,
        meta.alwaysShow ? 1 : 0,
        meta.noCache ? 1 : 0,
        meta.affix ? 1 : 0,
        meta.activeMenu || null,
        1
      ]
    )

    const menuId = result.insertId
    if (route.children && route.children.length) {
      await insertMenuTree(route.children, menuId)
    }
  }
}

const main = async () => {
  const localeMap = parseLocaleRouter()

  const moduleFiles = fs
    .readdirSync(ROUTER_DIR)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.join(ROUTER_DIR, file))

  const moduleRoutes = moduleFiles.flatMap((file) => extractRoutesFromFile(file, localeMap))
  const indexRoutes = extractRoutesFromFile(ROUTER_INDEX, localeMap, 'asyncRouterMap')

  const allRoutes = flattenRoutes([...indexRoutes, ...moduleRoutes])

  await db.pool.execute('DELETE FROM role_menu')
  await db.pool.execute('DELETE FROM sys_menu')
  await db.pool.execute('ALTER TABLE sys_menu AUTO_INCREMENT = 1')

  await insertMenuTree(allRoutes, 0)

  const [roleRows] = await db.pool.execute(
    "SELECT id FROM roles WHERE role_code = 'superadmin' LIMIT 1"
  )
  if (roleRows.length) {
    await db.pool.execute(
      'INSERT IGNORE INTO role_menu (role_id, menu_id) SELECT ?, id FROM sys_menu',
      [roleRows[0].id]
    )
  }

  console.log('✅ sys_menu 与 role_menu 已根据前端路由重新生成')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ 生成菜单失败:', err.message)
  process.exit(1)
})
