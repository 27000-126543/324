/**
 * 模拟任务 API 路由
 * GET    /api/simulations              - 获取模拟任务列表
 * POST   /api/simulations              - 创建新的模拟任务
 * GET    /api/simulations/:id          - 获取单个模拟任务详情
 * PUT    /api/simulations/:id          - 更新模拟任务
 * GET    /api/simulations/:id/time-series  - 获取模拟时序数据
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import type {
  SimulationTask,
  SimulationParameters,
  SimulationStatus,
  SimulationTimePoint,
} from '@shared/types'
import { MockDataFactory } from '../../src/mock/factory'

const router = Router()

let mockData = MockDataFactory.createAll()
let simulations: SimulationTask[] = [...mockData.simulations]

const statusProgressMap: Record<SimulationStatus, number> = {
  PENDING_VALIDATION: 5,
  NETWORK_BUILDING: 20,
  COMPONENT_INITIALIZING: 40,
  DECOMPOSITION_CALCULATING: 65,
  FLUX_ANALYZING: 85,
  COMPLETED: 100,
  EXCEPTION_FALLBACK: 100,
}

interface CreateSimulationBody {
  name: string
  soilDataId: string
  metagenomicsFileId?: string
  parameters: Partial<SimulationParameters>
  createdBy: string
}

interface UpdateSimulationBody {
  name?: string
  status?: SimulationStatus
  parameters?: Partial<SimulationParameters>
}

/**
 * GET /api/simulations
 * 查询参数：status, soilType, createdBy, page, pageSize
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      soilType,
      createdBy,
      page = '1',
      pageSize = '20',
    } = req.query

    let result = [...simulations]

    if (status && typeof status === 'string') {
      result = result.filter((s) => s.status === status)
    }
    if (createdBy && typeof createdBy === 'string') {
      result = result.filter((s) => s.createdBy === createdBy)
    }
    if (soilType && typeof soilType === 'string') {
      const soilIds = mockData.soilData
        .filter((sd) => sd.soilType === soilType)
        .map((sd) => sd.id)
      result = result.filter((s) => soilIds.includes(s.soilDataId))
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const pageNum = parseInt(page as string, 10)
    const sizeNum = parseInt(pageSize as string, 10)
    const startIdx = (pageNum - 1) * sizeNum
    const paged = result.slice(startIdx, startIdx + sizeNum)

    res.status(200).json({
      success: true,
      data: {
        items: paged,
        total: result.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(result.length / sizeNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取模拟任务列表失败',
    })
  }
})

/**
 * POST /api/simulations
 * 创建新的模拟任务
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateSimulationBody

    if (!body.name || !body.soilDataId || !body.createdBy) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段：name, soilDataId, createdBy',
      })
      return
    }

    const defaultParams: SimulationParameters = {
      simulationDays: 30,
      timeStepHours: 4,
      temperatureModel: 'DIURNAL',
      moistureModel: 'RAINFALL',
      co2BaselineUpper: 4.5,
      co2BaselineLower: 2.0,
      enzymeDropThreshold: 30,
      substrateAddition: body.parameters?.substrateAddition ?? [],
      microbeInoculation: body.parameters?.microbeInoculation ?? [],
    }

    const now = dayjs().toISOString()
    const id = `sim_${dayjs().format('YYYYMM')}_${String(simulations.length + 1).padStart(4, '0')}`

    const newSim: SimulationTask = {
      id,
      taskNo: `TASK-${dayjs().format('YYYYMMDD')}-${String(simulations.length + 1).padStart(3, '0')}`,
      name: body.name,
      soilDataId: body.soilDataId,
      metagenomicsFileId: body.metagenomicsFileId,
      status: 'PENDING_VALIDATION',
      statusHistory: [
        {
          status: 'PENDING_VALIDATION',
          timestamp: now,
          operatorId: body.createdBy,
          remark: '任务创建，待微生物组成验证',
        },
      ],
      parameters: { ...defaultParams, ...body.parameters },
      currentProgress: statusProgressMap.PENDING_VALIDATION,
      microbes: [],
      carbonPools: [],
      enzymes: [],
      timeSeriesData: [],
      warnings: [],
      adjustmentLogs: [],
      approvals: [],
      createdAt: now,
      createdBy: body.createdBy,
      soilId: body.soilDataId,
    }

    simulations.unshift(newSim)

    res.status(201).json({
      success: true,
      data: newSim,
      message: '模拟任务创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建模拟任务失败',
    })
  }
})

/**
 * GET /api/simulations/:id
 * 获取单个模拟任务详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const sim = simulations.find((s) => s.id === id)

    if (!sim) {
      res.status(404).json({
        success: false,
        error: `模拟任务 ${id} 不存在`,
      })
      return
    }

    res.status(200).json({
      success: true,
      data: sim,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取模拟任务详情失败',
    })
  }
})

/**
 * PUT /api/simulations/:id
 * 更新模拟任务
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const body = req.body as UpdateSimulationBody
    const simIndex = simulations.findIndex((s) => s.id === id)

    if (simIndex === -1) {
      res.status(404).json({
        success: false,
        error: `模拟任务 ${id} 不存在`,
      })
      return
    }

    const currentSim = simulations[simIndex]
    const updates: Partial<SimulationTask> = {}

    if (body.name) {
      updates.name = body.name
    }

    if (body.status && body.status !== currentSim.status) {
      const now = dayjs().toISOString()
      updates.status = body.status
      updates.currentProgress = statusProgressMap[body.status]
      updates.statusHistory = [
        ...currentSim.statusHistory,
        {
          status: body.status,
          timestamp: now,
          remark: `状态更新为 ${body.status}`,
          durationMs:
            currentSim.statusHistory.length > 0
              ? Date.now() - new Date(currentSim.statusHistory[currentSim.statusHistory.length - 1].timestamp).getTime()
              : undefined,
        },
      ]
    }

    if (body.parameters) {
      updates.parameters = { ...currentSim.parameters, ...body.parameters }
    }

    simulations[simIndex] = { ...currentSim, ...updates }

    res.status(200).json({
      success: true,
      data: simulations[simIndex],
      message: '模拟任务更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新模拟任务失败',
    })
  }
})

/**
 * GET /api/simulations/:id/time-series
 * 获取模拟时序数据
 */
router.get('/:id/time-series', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { format = 'full' } = req.query
    const sim = simulations.find((s) => s.id === id)

    if (!sim) {
      res.status(404).json({
        success: false,
        error: `模拟任务 ${id} 不存在`,
      })
      return
    }

    let timeSeries: SimulationTimePoint[] = sim.timeSeriesData

    if (format === 'co2-only') {
      timeSeries = timeSeries.map((tp) => ({
        timeHour: tp.timeHour,
        co2Flux: tp.co2Flux,
        temperature: tp.temperature,
        moisture: tp.moisture,
        microbialBiomass: tp.microbialBiomass,
        dissolvedOrganicC: 0,
        particulateOrganicC: 0,
        enzymeActivities: {},
        microbeAbundances: {},
        carbonPoolAmounts: {},
      }))
    } else if (format === 'sampled') {
      const step = Math.max(1, Math.floor(timeSeries.length / 100))
      timeSeries = timeSeries.filter((_, idx) => idx % step === 0)
    }

    const summary = timeSeries.length > 0
      ? {
          totalPoints: timeSeries.length,
          timeRange: {
            startHour: timeSeries[0].timeHour,
            endHour: timeSeries[timeSeries.length - 1].timeHour,
          },
          co2Stats: {
            max: Math.max(...timeSeries.map((t) => t.co2Flux)),
            min: Math.min(...timeSeries.map((t) => t.co2Flux)),
            avg: timeSeries.reduce((a, t) => a + t.co2Flux, 0) / timeSeries.length,
          },
        }
      : null

    res.status(200).json({
      success: true,
      data: {
        simulationId: id,
        timeSeries,
        summary,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取时序数据失败',
    })
  }
})

export default router
