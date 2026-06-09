/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import simulationRoutes from './routes/simulations.js'
import warningRoutes from './routes/warnings.js'
import approvalRoutes from './routes/approvals.js'
import reportRoutes from './routes/reports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
      )
    }
  })
  next()
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/simulations', simulationRoutes)
app.use('/api/warnings', warningRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/reports', reportRoutes)

/**
 * API Discovery / Index
 */
app.use(
  '/api',
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === '/' || req.path === '') {
      res.status(200).json({
        success: true,
        name: 'SoilSim 土壤微生物模拟平台 API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: {
            prefix: '/api/auth',
            routes: [
              { method: 'POST', path: '/login', desc: '用户登录' },
              { method: 'POST', path: '/register', desc: '用户注册' },
              { method: 'POST', path: '/logout', desc: '用户登出' },
              { method: 'GET', path: '/me', desc: '获取当前用户信息' },
              { method: 'GET', path: '/users', desc: '获取用户列表' },
            ],
          },
          simulations: {
            prefix: '/api/simulations',
            routes: [
              { method: 'GET', path: '/', desc: '获取模拟任务列表' },
              { method: 'POST', path: '/', desc: '创建模拟任务' },
              { method: 'GET', path: '/:id', desc: '获取模拟任务详情' },
              { method: 'PUT', path: '/:id', desc: '更新模拟任务' },
              { method: 'GET', path: '/:id/time-series', desc: '获取模拟时序数据' },
            ],
          },
          warnings: {
            prefix: '/api/warnings',
            routes: [
              { method: 'GET', path: '/', desc: '获取预警事件列表' },
              { method: 'GET', path: '/:id', desc: '获取预警详情' },
              { method: 'PUT', path: '/:id/acknowledge', desc: '签收/确认预警' },
              { method: 'POST', path: '/batch-acknowledge', desc: '批量签收预警' },
            ],
          },
          approvals: {
            prefix: '/api/approvals',
            routes: [
              { method: 'GET', path: '/', desc: '获取全部审批记录' },
              { method: 'GET', path: '/pending', desc: '获取待我审批列表' },
              { method: 'GET', path: '/:id', desc: '获取审批详情' },
              { method: 'PUT', path: '/:id/decide', desc: '审批决策（通过/驳回）' },
            ],
          },
          reports: {
            prefix: '/api/reports',
            routes: [
              { method: 'GET', path: '/', desc: '获取报告列表' },
              { method: 'GET', path: '/:id', desc: '获取报告详情' },
              { method: 'POST', path: '/:id/export', desc: '导出报告（PDF/Excel/ZIP）' },
              { method: 'GET', path: '/download/:token', desc: '下载导出文件' },
            ],
          },
        },
      })
      return
    }
    next()
  },
)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        usage: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        unit: 'MB',
      },
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.originalUrl ?? req.path,
    method: req.method,
    hint: '访问 GET /api 查看所有可用端点',
  })
})

export default app
