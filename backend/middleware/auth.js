const db = require('../db');

/**
 * 权限检查中间件
 * 用法: router.post('/users', checkPermission('system:user'), handler)
 */
const checkPermission = (permissionCode) => {
  return async (req, res, next) => {
    // 从请求头获取用户ID（前端需要在请求头中发送）
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
    }

    try {
      // 查询用户角色
      const [users] = await db.pool.execute(`
        SELECT u.role_id, u.role AS user_role, r.role_code 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }

      const user = users[0];
      const roleCode = user.role_code || user.user_role;

      // 超级管理员拥有所有权限
      if (roleCode === 'superadmin') {
        req.user = { id: userId, roleCode: 'superadmin' };
        return next();
      }

      // 人民调解：除只读用户外均可增删改查
      if (permissionCode.startsWith('mediation:') && roleCode && roleCode !== 'readonly') {
        req.user = { id: userId, roleCode };
        return next();
      }

      // 检查用户是否有指定权限
      const [permissions] = await db.pool.execute(`
        SELECT p.permission_code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.permission_code = ?
      `, [user.role_id, permissionCode]);

      if (permissions.length === 0) {
        return res.status(403).json({ code: 403, message: '您没有权限执行此操作' });
      }

      req.user = { id: userId, roleCode: user.role_code };
      next();
    } catch (err) {
      console.error('权限检查失败:', err.message);
      res.status(500).json({ code: 500, message: '权限检查失败' });
    }
  };
};

/**
 * 登录校验中间件（只校验登录和用户存在）
 */
const requireAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }

  try {
    const [users] = await db.pool.execute(`
      SELECT u.id, u.username, u.real_name, u.role_id, r.role_code, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    console.error('登录校验失败:', err.message);
    res.status(500).json({ code: 500, message: '登录校验失败' });
  }
};

/**
 * 可选权限检查（不强制，用于获取用户信息）
 */
const optionalAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (userId) {
    try {
      const [users] = await db.pool.execute(`
        SELECT u.id, u.username, u.real_name, u.role_id, r.role_code, r.role_name
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [userId]);

      if (users.length > 0) {
        req.user = users[0];
      }
    } catch (err) {
      console.error('获取用户信息失败:', err.message);
    }
  }
  
  next();
};

module.exports = { checkPermission, optionalAuth, requireAuth };
