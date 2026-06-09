/**
 * 审批记录 API 路由
 * GET  /api/approvals/pending          - 获取待我审批的列表
 * PUT  /api/approvals/:id/decide       - 审批决策（通过/拒绝）
 * GET  /api/approvals                   - 获取全部审批记录
 */
import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import type {
  ApprovalRecord,
  ApprovalResult,
  ApprovalStage,
} from '@shared/types'
import { MockDataFactory } from '../../src/mock/factory'

const router = Router()

let mockData = MockDataFactory.createAll()

const collectAllApprovals = (): ApprovalRecord[] => {
  return mockData.simulations.flatMap((s) =>
    s.approvals.map((a) => ({
      ...a,
      simulationName: s.name,
      simulationTaskNo: s.taskNo,
      simulationStatus: s.status,
    }))
  )
}

let approvalsCache: ApprovalRecord[] = collectAllApprovals()

const refreshApprovalsCache = () => {
  approvalsCache = collectAllApprovals()
}

const STAGE_LABELS: Record<ApprovalStage, string> = {
  MICROBE_VALIDATION: '微生物组成验证',
  SOIL_HEALTH_EXPERT: '土壤健康专家评估',
}

const RESULT_LABELS: Record<ApprovalResult, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
}

interface DecideBody {
  approverId: string
  result: ApprovalResult
  comment?: string
  attachments?: string[]
}

/**
 * GET /api/approvals
 * 查询参数：stage, result, approverId, simulationId, page, pageSize
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    refreshApprovalsCache()
    const {
      stage,
      result,
      approverId,
      simulationId,
      page = '1',
      pageSize = '30',
    } = req.query

    let approvals = [...approvalsCache]

    if (stage && typeof stage === 'string') {
      approvals = approvals.filter((a) => a.stage === stage)
    }
    if (result && typeof result === 'string') {
      approvals = approvals.filter((a) => a.result === result)
    }
    if (approverId && typeof approverId === 'string') {
      approvals = approvals.filter((a) => a.approverId === approverId)
    }
    if (simulationId && typeof simulationId === 'string') {
      approvals = approvals.filter((a) => a.simulationId === simulationId)
    }

    approvals.sort((a, b) => {
      const ta = a.decidedAt ?? a.submittedAt ?? ''
      const tb = b.decidedAt ?? b.submittedAt ?? ''
      return new Date(tb).getTime() - new Date(ta).getTime()
    })

    const pageNum = parseInt(page as string, 10)
    const sizeNum = parseInt(pageSize as string, 10)
    const startIdx = (pageNum - 1) * sizeNum
    const paged = approvals.slice(startIdx, startIdx + sizeNum)

    const stats = {
      total: approvalsCache.length,
      pending: approvalsCache.filter((a) => a.result === 'PENDING').length,
      approved: approvalsCache.filter((a) => a.result === 'APPROVED').length,
      rejected: approvalsCache.filter((a) => a.result === 'REJECTED').length,
      pendingMicrobe: approvalsCache.filter(
        (a) => a.stage === 'MICROBE_VALIDATION' && a.result === 'PENDING'
      ).length,
      pendingSoil: approvalsCache.filter(
        (a) => a.stage === 'SOIL_HEALTH_EXPERT' && a.result === 'PENDING'
      ).length,
    }

    res.status(200).json({
      success: true,
      data: {
        items: paged,
        total: approvals.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(approvals.length / sizeNum),
        stats,
        meta: {
          stageLabels: STAGE_LABELS,
          resultLabels: RESULT_LABELS,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批记录失败',
    })
  }
})

/**
 * GET /api/approvals/pending
 * 获取当前用户待处理的审批（或全部待处理）
 * 查询参数：approverId - 指定审批人ID
 */
router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    refreshApprovalsCache()
    const { approverId, stage } = req.query

    let pending = approvalsCache.filter((a) => a.result === 'PENDING')

    if (approverId && typeof approverId === 'string') {
      pending = pending.filter((a) => a.approverId === approverId)
    }
    if (stage && typeof stage === 'string') {
      pending = pending.filter((a) => a.stage === stage)
    }

    pending.sort((a, b) => {
      const ta = a.submittedAt ?? ''
      const tb = b.submittedAt ?? ''
      return new Date(ta).getTime() - new Date(tb).getTime()
    })

    const enriched = pending.map((appr) => {
      const sim = mockData.simulations.find((s) => s.id === appr.simulationId)
      return {
        ...appr,
        simulation: sim
          ? {
              id: sim.id,
              taskNo: sim.taskNo,
              name: sim.name,
              status: sim.status,
              soilDataId: sim.soilDataId,
              progress: sim.currentProgress,
            }
          : null,
        soilData: sim
          ? mockData.soilData.find((sd) => sd.id === sim.soilDataId) ?? null
          : null,
      }
    })

    const myCounts = approverId
      ? {
          mine: pending.length,
          overdue: pending.filter((a) => {
            if (!a.submittedAt) return false
            const hours = (Date.now() - new Date(a.submittedAt).getTime()) / 3600000
            return hours > 24
          }).length,
        }
      : null

    res.status(200).json({
      success: true,
      data: {
        items: enriched,
        total: pending.length,
        stageBreakdown: {
          microbeValidation: pending.filter((a) => a.stage === 'MICROBE_VALIDATION').length,
          soilExpert: pending.filter((a) => a.stage === 'SOIL_HEALTH_EXPERT').length,
        },
        myCounts,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取待审批列表失败',
    })
  }
})

/**
 * GET /api/approvals/:id
 * 获取审批详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    refreshApprovalsCache()
    const { id } = req.params
    const approval = approvalsCache.find((a) => a.id === id)

    if (!approval) {
      res.status(404).json({
        success: false,
        error: `审批记录 ${id} 不存在`,
      })
      return
    }

    const sim = mockData.simulations.find((s) => s.id === approval.simulationId)
    const simApprovals = sim?.approvals ?? []
    const allStagesComplete =
      simApprovals.filter((a) => a.result === 'APPROVED').length >= 2

    res.status(200).json({
      success: true,
      data: {
        approval,
        simulation: sim
          ? {
              id: sim.id,
              taskNo: sim.taskNo,
              name: sim.name,
              status: sim.status,
              parameters: sim.parameters,
              microbeCount: sim.microbes.length,
              enzymeCount: sim.enzymes.length,
            }
          : null,
        relatedApprovals: simApprovals,
        allStagesComplete,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取审批详情失败',
    })
  }
})

/**
 * PUT /api/approvals/:id/decide
 * 进行审批决策：APPROVED / REJECTED
 */
router.put('/:id/decide', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const body = req.body as DecideBody

    if (!body.approverId || !body.result) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：approverId 和 result (APPROVED/REJECTED)',
      })
      return
    }

    if (!['APPROVED', 'REJECTED'].includes(body.result)) {
      res.status(400).json({
        success: false,
        error: 'result 字段只能是 APPROVED 或 REJECTED',
      })
      return
    }

    let found = false
    const now = dayjs().toISOString()
    const approverUser = mockData.users.find((u) => u.id === body.approverId)

    mockData.simulations = mockData.simulations.map((sim) => {
      const approvals = sim.approvals.map((a) => {
        if (a.id === id) {
          if (a.result !== 'PENDING') {
            return a
          }
          found = true
          return {
            ...a,
            result: body.result,
            approverId: body.approverId,
            approverName: approverUser?.fullName ?? a.approverName,
            approverRole: approverUser?.role ?? a.approverRole,
            comment: body.comment ?? a.comment,
            attachments: body.attachments ?? a.attachments,
            decidedAt: now,
          }
        }
        return a
      })

      if (found) {
        const allApproved =
          approvals.length >= 2 && approvals.every((a) => a.result === 'APPROVED')

        let newStatus = sim.status
        let history = sim.statusHistory

        if (allApproved && sim.status === 'PENDING_VALIDATION') {
          newStatus = 'NETWORK_BUILDING'
          history = [
            ...history,
            {
              status: 'NETWORK_BUILDING',
              timestamp: now,
              operatorId: body.approverId,
              remark: '两级审批通过，进入代谢网络构建阶段',
            },
          ]
        }

        return {
          ...sim,
          approvals,
          status: newStatus,
          statusHistory: history,
          currentProgress:
            newStatus === 'NETWORK_BUILDING' ? 20 : sim.currentProgress,
        }
      }

      return { ...sim, approvals }
    })

    if (!found) {
      res.status(404).json({
        success: false,
        error: `审批记录 ${id} 不存在或已处理`,
      })
      return
    }

    refreshApprovalsCache()
    const updated = approvalsCache.find((a) => a.id === id)

    res.status(200).json({
      success: true,
      data: updated,
      message:
        body.result === 'APPROVED'
          ? `审批通过：${approverUser?.fullName ?? body.approverId} 已确认`
          : `审批驳回：${approverUser?.fullName ?? body.approverId} 给出意见`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '审批处理失败',
    })
  }
})

export default router
