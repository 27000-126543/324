/**
 * 用户认证与账户 API 路由
 * POST /api/auth/register   - 用户注册
 * POST /api/auth/login      - 用户登录
 * POST /api/auth/logout     - 用户登出
 * GET  /api/auth/me         - 获取当前登录用户信息（通过token）
 * GET  /api/auth/users      - 获取系统用户列表
 * POST /api/auth/refresh    - 刷新访问令牌
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import crypto from 'crypto'
import type { User, UserRole } from '@shared/types'
import { MockDataFactory } from '../../src/mock/factory'

const router = Router()

let mockData = MockDataFactory.createAll()
let users: User[] = [...mockData.users]

interface AuthToken {
  token: string
  userId: string
  issuedAt: string
  expiresAt: string
  refreshToken: string
  refreshExpiresAt: string
}

const activeTokens: Map<string, AuthToken> = new Map()
const refreshTokens: Map<string, string> = new Map()

const ROLE_LABELS: Record<UserRole, string> = {
  FARM_ADMIN: '农场管理员',
  ECOLOGIST: '生态学家',
  MICROBE_VALIDATOR: '微生物验证者',
  SOIL_EXPERT: '土壤健康专家',
  CHIEF_SCIENTIST: '首席科学家',
}

const PASSWORD_SALT = 'soilsim-salt-v1'

const hashPassword = (plain: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${PASSWORD_SALT}::${plain}`)
    .digest('hex')
}

const verifyPassword = (plain: string, storedHash: string): boolean => {
  const MOCK_PASSWORDS: Record<string, string> = {
    u_farm_admin_01: 'farm123',
    u_ecologist_02: 'eco123',
    u_microbe_validator_03: 'micro123',
    u_soil_expert_04: 'soil123',
    u_chief_scientist_05: 'chief123',
  }
  if (MOCK_PASSWORDS[storedHash] !== undefined) {
    return plain === MOCK_PASSWORDS[storedHash]
  }
  return hashPassword(plain) === storedHash
}

const DEMO_CREDENTIALS: Array<{
  username: string
  password: string
  roleHint: string
}> = [
  { username: 'chief_sci', password: 'chief123', roleHint: '首席科学家（全部权限）' },
  { username: 'soil_expert', password: 'soil123', roleHint: '土壤健康专家' },
  { username: 'microbe_val', password: 'micro123', roleHint: '微生物验证员' },
  { username: 'ecologist', password: 'eco123', roleHint: '生态研究员' },
  { username: 'farm', password: 'farm123', roleHint: '农场管理员' },
]

const generateTokenPair = (userId: string): AuthToken => {
  const token = `soilsim_${crypto.randomBytes(24).toString('hex')}`
  const refreshToken = `soilsim_refresh_${crypto.randomBytes(32).toString('hex')}`
  const issuedAt = dayjs().toISOString()
  const expiresAt = dayjs().add(2, 'hour').toISOString()
  const refreshExpiresAt = dayjs().add(7, 'day').toISOString()

  const authToken: AuthToken = {
    token,
    userId,
    issuedAt,
    expiresAt,
    refreshToken,
    refreshExpiresAt,
  }

  activeTokens.set(token, authToken)
  refreshTokens.set(refreshToken, token)

  return authToken
}

const extractToken = (req: Request): string | null => {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token
  }
  return null
}

const authenticate = (req: Request): User | null => {
  const token = extractToken(req)
  if (!token) return null

  const auth = activeTokens.get(token)
  if (!auth) return null

  if (new Date(auth.expiresAt).getTime() < Date.now()) {
    activeTokens.delete(token)
    return null
  }

  return users.find((u) => u.id === auth.userId) ?? null
}

interface LoginBody {
  username?: string
  email?: string
  password: string
}

/**
 * POST /api/auth/login
 * 用户登录，支持用户名/邮箱 + 密码
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    await new Promise((r) => setTimeout(r, 400))

    const body = req.body as LoginBody

    if (!body.password) {
      res.status(400).json({
        success: false,
        error: '缺少密码字段',
      })
      return
    }

    const identifier = body.username?.toLowerCase() || body.email?.toLowerCase()
    if (!identifier) {
      res.status(400).json({
        success: false,
        error: '请提供用户名或邮箱',
      })
      return
    }

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === identifier ||
        u.email.toLowerCase() === identifier
    )

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在',
        hint: DEMO_CREDENTIALS,
      })
      return
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: '该账户已被禁用，请联系系统管理员',
      })
      return
    }

    const passwordValid = verifyPassword(body.password, user.passwordHash)
    if (!passwordValid) {
      res.status(401).json({
        success: false,
        error: '密码错误',
        attemptsLeft: 3,
        hint: DEMO_CREDENTIALS,
      })
      return
    }

    const tokenPair = generateTokenPair(user.id)

    const loginTime = dayjs().toISOString()
    users = users.map((u) =>
      u.id === user.id ? { ...u, lastLoginAt: loginTime } : u
    )

    const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
      FARM_ADMIN: ['data:upload', 'sim:read', 'report:export'],
      ECOLOGIST: ['data:upload', 'data:edit', 'sim:create', 'sim:execute', 'sim:read', 'sim:edit', 'warn:review', 'report:export'],
      MICROBE_VALIDATOR: ['sim:read', 'app:microbe', 'warn:review', 'report:export'],
      SOIL_EXPERT: ['sim:read', 'app:soil', 'warn:review', 'report:export'],
      CHIEF_SCIENTIST: ['data:upload', 'data:edit', 'data:delete', 'sim:create', 'sim:execute', 'sim:read', 'sim:edit', 'app:microbe', 'app:soil', 'warn:review', 'report:export', 'system:config', 'user:manage'],
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleLabel: ROLE_LABELS[user.role],
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: loginTime,
        },
        token: tokenPair.token,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 7200,
        expiresAt: tokenPair.expiresAt,
        permissions: ROLE_PERMISSIONS[user.role] ?? [],
      },
      message: `欢迎回来，${user.fullName}！登录成功`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录过程中发生错误',
    })
  }
})

/**
 * POST /api/auth/register
 * 用户注册（演示模式，实际生产需邮件验证）
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, fullName, email, phone, password, role = 'ECOLOGIST' } = req.body as {
      username: string
      fullName: string
      email: string
      phone?: string
      password: string
      role?: UserRole
    }

    if (!username || !fullName || !email || !password) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：username, fullName, email, password',
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: '密码长度至少 6 位',
      })
      return
    }

    const exists = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    )
    if (exists) {
      res.status(409).json({
        success: false,
        error: '用户名或邮箱已被注册',
      })
      return
    }

    const validRoles: UserRole[] = ['FARM_ADMIN', 'ECOLOGIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'CHIEF_SCIENTIST']
    const assignedRole: UserRole = validRoles.includes(role) ? role : 'ECOLOGIST'

    const now = dayjs().toISOString()
    const newUser: User = {
      id: `u_reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      username,
      fullName,
      email,
      phone,
      role: assignedRole,
      passwordHash: hashPassword(password),
      status: 'ACTIVE',
      createdAt: now,
    }

    users.push(newUser)

    const tokenPair = generateTokenPair(newUser.id)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          roleLabel: ROLE_LABELS[newUser.role],
          status: newUser.status,
          createdAt: now,
        },
        token: tokenPair.token,
        refreshToken: tokenPair.refreshToken,
      },
      message: '注册成功，已自动登录',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败',
    })
  }
})

/**
 * POST /api/auth/logout
 * 用户登出，作废令牌
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = extractToken(req)
    if (token) {
      const auth = activeTokens.get(token)
      if (auth) {
        refreshTokens.delete(auth.refreshToken)
      }
      activeTokens.delete(token)
    }

    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) {
      const associated = refreshTokens.get(refreshToken)
      if (associated) {
        activeTokens.delete(associated)
      }
      refreshTokens.delete(refreshToken)
    }

    res.status(200).json({
      success: true,
      message: '已成功登出',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登出失败',
    })
  }
})

/**
 * POST /api/auth/refresh
 * 使用刷新令牌获取新的访问令牌
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: '缺少 refreshToken',
      })
      return
    }

    const associatedToken = refreshTokens.get(refreshToken)
    if (!associatedToken) {
      res.status(401).json({
        success: false,
        error: '刷新令牌无效或已过期',
      })
      return
    }

    const oldAuth = activeTokens.get(associatedToken)
    if (!oldAuth || new Date(oldAuth.refreshExpiresAt).getTime() < Date.now()) {
      refreshTokens.delete(refreshToken)
      if (associatedToken) activeTokens.delete(associatedToken)
      res.status(401).json({
        success: false,
        error: '刷新令牌已过期，请重新登录',
      })
      return
    }

    refreshTokens.delete(refreshToken)
    activeTokens.delete(associatedToken)

    const newPair = generateTokenPair(oldAuth.userId)

    res.status(200).json({
      success: true,
      data: {
        token: newPair.token,
        refreshToken: newPair.refreshToken,
        expiresAt: newPair.expiresAt,
        refreshExpiresAt: newPair.refreshExpiresAt,
      },
      message: '令牌刷新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '令牌刷新失败',
    })
  }
})

/**
 * GET /api/auth/me
 * 获取当前登录用户的完整信息
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = authenticate(req)

    if (!user) {
      res.status(401).json({
        success: false,
        error: '未登录或令牌已过期',
      })
      return
    }

    const userSims = mockData.simulations.filter((s) => s.createdBy === user.id)
    const pendingApprovals = mockData.simulations.flatMap((s) =>
      s.approvals.filter(
        (a) => a.approverId === user.id && a.result === 'PENDING'
      )
    )

    const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
      FARM_ADMIN: ['data:upload', 'sim:read', 'report:export'],
      ECOLOGIST: ['data:upload', 'data:edit', 'sim:create', 'sim:execute', 'sim:read', 'sim:edit', 'warn:review', 'report:export'],
      MICROBE_VALIDATOR: ['sim:read', 'app:microbe', 'warn:review', 'report:export'],
      SOIL_EXPERT: ['sim:read', 'app:soil', 'warn:review', 'report:export'],
      CHIEF_SCIENTIST: ['data:upload', 'data:edit', 'data:delete', 'sim:create', 'sim:execute', 'sim:read', 'sim:edit', 'app:microbe', 'app:soil', 'warn:review', 'report:export', 'system:config', 'user:manage'],
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleLabel: ROLE_LABELS[user.role],
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        permissions: ROLE_PERMISSIONS[user.role] ?? [],
        stats: {
          totalSimulations: userSims.length,
          completedSimulations: userSims.filter((s) => s.status === 'COMPLETED').length,
          pendingApprovals: pendingApprovals.length,
          unreadWarnings: mockData.warnings.filter(
            (w) => !w.acknowledgedBy && user.role !== 'FARM_ADMIN'
          ).length,
        },
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            inApp: true,
            sms: user.role === 'CHIEF_SCIENTIST' || user.role === 'SOIL_EXPERT',
          },
          language: 'zh-CN',
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    })
  }
})

/**
 * GET /api/auth/users
 * 获取系统用户列表（需要 user:manage 权限或首席科学家）
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = authenticate(req)
    const { role, status, search, page = '1', pageSize = '50' } = req.query

    if (user && user.role !== 'CHIEF_SCIENTIST') {
      res.status(403).json({
        success: false,
        error: '仅首席科学家可查看用户列表',
      })
      return
    }

    let result = [...users]

    if (role && typeof role === 'string') {
      result = result.filter((u) => u.role === role)
    }
    if (status && typeof status === 'string') {
      result = result.filter(
        (u) => u.status === (status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE')
      )
    }
    if (search && typeof search === 'string') {
      const s = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      )
    }

    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const pageNum = parseInt(page as string, 10)
    const sizeNum = parseInt(pageSize as string, 10)
    const startIdx = (pageNum - 1) * sizeNum
    const paged = result.slice(startIdx, startIdx + sizeNum)

    const roleStats = (['FARM_ADMIN', 'ECOLOGIST', 'MICROBE_VALIDATOR', 'SOIL_EXPERT', 'CHIEF_SCIENTIST'] as UserRole[]).map(
      (r) => ({
        role: r,
        label: ROLE_LABELS[r],
        count: users.filter((u) => u.role === r).length,
        active: users.filter((u) => u.role === r && u.status === 'ACTIVE').length,
      })
    )

    res.status(200).json({
      success: true,
      data: {
        items: paged.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          roleLabel: ROLE_LABELS[u.role],
          status: u.status,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        })),
        total: result.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(result.length / sizeNum),
        roleStats,
        activeCount: users.filter((u) => u.status === 'ACTIVE').length,
        inactiveCount: users.filter((u) => u.status === 'INACTIVE').length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    })
  }
})

router.get('/demo-credentials', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: DEMO_CREDENTIALS,
    message: '演示账号信息（开发环境）',
  })
})

export default router
