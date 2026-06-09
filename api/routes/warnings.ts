/**
 * 预警事件 API 路由
 * GET    /api/warnings                  - 获取预警事件列表
 * PUT    /api/warnings/:id/acknowledge  - 确认/签收预警事件
 */
import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import type { WarningEvent, WarningLevel, WarningType } from '@shared/types'
import { MockDataFactory } from '../../src/mock/factory'

const router = Router()

let mockData = MockDataFactory.createAll()
let warnings: WarningEvent[] = [...mockData.warnings]

const WARNING_TYPE_LABELS: Record<WarningType, string> = {
  CO2_DEVIATION: 'CO₂通量偏差',
  ENZYME_DROP: '酶活性骤降',
  BIOMASS_COLLAPSE: '微生物量崩溃',
  CONVERGENCE_FAIL: '计算收敛失败',
}

const WARNING_LEVEL_LABELS: Record<WarningLevel, string> = {
  INFO: '信息',
  WARNING: '警告',
  CRITICAL: '严重',
}

interface AcknowledgeBody {
  acknowledgedBy: string
  reviewComment?: string
  resolved?: boolean
}

/**
 * GET /api/warnings
 * 查询参数：level, type, resolved, simulationId, page, pageSize
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      level,
      type,
      resolved,
      simulationId,
      acknowledged,
      page = '1',
      pageSize = '50',
    } = req.query

    let result = [...warnings]

    if (level && typeof level === 'string') {
      const levels = (level as string).split(',') as WarningLevel[]
      result = result.filter((w) => levels.includes(w.level))
    }
    if (type && typeof type === 'string') {
      const types = (type as string).split(',') as WarningType[]
      result = result.filter((w) => types.includes(w.type))
    }
    if (resolved !== undefined) {
      const isResolved = resolved === 'true'
      result = result.filter((w) => w.resolved === isResolved)
    }
    if (acknowledged !== undefined) {
      const isAck = acknowledged === 'true'
      result = isAck
        ? result.filter((w) => w.acknowledgedBy !== undefined)
        : result.filter((w) => w.acknowledgedBy === undefined)
    }
    if (simulationId && typeof simulationId === 'string') {
      result = result.filter((w) => w.simulationId === simulationId)
    }

    result.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())

    const pageNum = parseInt(page as string, 10)
    const sizeNum = parseInt(pageSize as string, 10)
    const startIdx = (pageNum - 1) * sizeNum
    const paged = result.slice(startIdx, startIdx + sizeNum)

    const stats = {
      total: warnings.length,
      unacknowledged: warnings.filter((w) => !w.acknowledgedBy).length,
      unresolved: warnings.filter((w) => !w.resolved).length,
      critical: warnings.filter((w) => w.level === 'CRITICAL' && !w.resolved).length,
      warning: warnings.filter((w) => w.level === 'WARNING' && !w.resolved).length,
    }

    res.status(200).json({
      success: true,
      data: {
        items: paged,
        total: result.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(result.length / sizeNum),
        stats,
        meta: {
          typeLabels: WARNING_TYPE_LABELS,
          levelLabels: WARNING_LEVEL_LABELS,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取预警列表失败',
    })
  }
})

/**
 * GET /api/warnings/:id
 * 获取单个预警详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const warning = warnings.find((w) => w.id === id)

    if (!warning) {
      res.status(404).json({
        success: false,
        error: `预警事件 ${id} 不存在`,
      })
      return
    }

    const relatedSim = mockData.simulations.find((s) => s.id === warning.simulationId)
    const relatedAdjustments = relatedSim?.adjustmentLogs.filter((a) => a.warningId === id) ?? []

    res.status(200).json({
      success: true,
      data: {
        warning,
        simulation: relatedSim
          ? {
              id: relatedSim.id,
              taskNo: relatedSim.taskNo,
              name: relatedSim.name,
              status: relatedSim.status,
            }
          : null,
        adjustments: relatedAdjustments,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取预警详情失败',
    })
  }
})

/**
 * PUT /api/warnings/:id/acknowledge
 * 确认/签收预警，可附复核意见和标记已解决
 */
router.put('/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const body = req.body as AcknowledgeBody

    if (!body.acknowledgedBy) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：acknowledgedBy（操作人ID）',
      })
      return
    }

    const warningIndex = warnings.findIndex((w) => w.id === id)

    if (warningIndex === -1) {
      res.status(404).json({
        success: false,
        error: `预警事件 ${id} 不存在`,
      })
      return
    }

    const ackUser = mockData.users.find((u) => u.id === body.acknowledgedBy)
    const now = dayjs().toISOString()

    warnings[warningIndex] = {
      ...warnings[warningIndex],
      acknowledgedBy: body.acknowledgedBy,
      acknowledgedAt: now,
      reviewComment: body.reviewComment ?? warnings[warningIndex].reviewComment,
      resolved: body.resolved !== undefined ? body.resolved : warnings[warningIndex].resolved,
    }

    res.status(200).json({
      success: true,
      data: warnings[warningIndex],
      message: body.resolved
        ? `预警已由 ${ackUser?.fullName ?? body.acknowledgedBy} 标记解决`
        : `预警已由 ${ackUser?.fullName ?? body.acknowledgedBy} 签收`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '预警签收失败',
    })
  }
})

/**
 * POST /api/warnings/batch-acknowledge
 * 批量签收预警
 */
router.post('/batch-acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, acknowledgedBy, reviewComment } = req.body as {
      ids: string[]
      acknowledgedBy: string
      reviewComment?: string
    }

    if (!ids || ids.length === 0 || !acknowledgedBy) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：ids数组 和 acknowledgedBy',
      })
      return
    }

    const now = dayjs().toISOString()
    let ackCount = 0

    warnings = warnings.map((w) => {
      if (ids.includes(w.id) && !w.acknowledgedBy) {
        ackCount++
        return {
          ...w,
          acknowledgedBy,
          acknowledgedAt: now,
          reviewComment: reviewComment ?? w.reviewComment,
        }
      }
      return w
    })

    res.status(200).json({
      success: true,
      data: {
        acknowledged: ackCount,
        total: ids.length,
      },
      message: `批量签收完成，成功处理 ${ackCount} 条预警`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '批量签收失败',
    })
  }
})

export default router
