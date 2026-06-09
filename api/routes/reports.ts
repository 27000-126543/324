/**
 * 报告 API 路由
 * GET   /api/reports/:id              - 获取报告详情
 * POST  /api/reports/:id/export       - 导出报告为指定格式
 * GET   /api/reports                   - 获取报告列表
 */
import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import type { SimulationReport, SimulationTask } from '@shared/types'
import { MockDataFactory } from '../../src/mock/factory'

const router = Router()

let mockData = MockDataFactory.createAll()

const buildReportFromSimulation = (sim: SimulationTask): SimulationReport => {
  const lastIdx = sim.timeSeriesData.length - 1
  const totalCo2 = sim.timeSeriesData.reduce((acc, t) => acc + t.co2Flux, 0)
  const avgRate = sim.timeSeriesData.length > 0 ? totalCo2 / sim.timeSeriesData.length : 0
  const finalCarbonStock =
    sim.timeSeriesData.length > 0
      ? Object.values(sim.timeSeriesData[lastIdx].carbonPoolAmounts).reduce(
          (a, b) => (a as number) + (b as number),
          0
        ) as number
      : 0

  const initCarbon =
    (sim.carbonPools.reduce((acc, p) => acc + p.initialAmount, 0) as number) || 1000
  const seqPotential = Math.max(0, (finalCarbonStock as number) - initCarbon * 0.7)

  return {
    id: sim.reportId ?? `rpt_${sim.id.slice(-8)}`,
    simulationId: sim.id,
    generatedAt: sim.status === 'COMPLETED'
      ? dayjs(sim.createdAt).add(2, 'hour').toISOString()
      : dayjs().toISOString(),
    summary: {
      totalCo2Released: Math.round((totalCo2 as number) * 100) / 100,
      averageDecompositionRate: Math.round((avgRate as number) * 1000) / 1000,
      finalCarbonStock: Math.round((finalCarbonStock as number) * 100) / 100,
      sequestrationPotential: Math.round((seqPotential as number) * 100) / 100,
    },
    figures: {
      carbonDecompositionCurve: `chart://reports/${sim.id}/carbon-decomposition.svg`,
      communityCompositionStack: `chart://reports/${sim.id}/community-stack.svg`,
      enzymeActivityHeatmap: `chart://reports/${sim.id}/enzyme-heatmap.svg`,
      carbonPoolTrend: `chart://reports/${sim.id}/carbon-pool-trend.svg`,
    },
    adjustmentLogAppendix: sim.adjustmentLogs,
    approvalAppendix: sim.approvals,
    pdfPath: sim.status === 'COMPLETED' ? `/reports/pdf/${sim.id}.pdf` : undefined,
  }
}

interface ExportBody {
  format: 'pdf' | 'excel' | 'json' | 'zip'
  includeCharts?: boolean
  includeAppendix?: boolean
  watermark?: string
}

/**
 * GET /api/reports
 * 查询参数：simulationId, generatedAfter, page, pageSize
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { simulationId, generatedAfter, format, page = '1', pageSize = '20' } = req.query

    const completedSims = mockData.simulations.filter(
      (s) => s.status === 'COMPLETED' || s.reportId
    )

    let reports = completedSims.map(buildReportFromSimulation)

    if (simulationId && typeof simulationId === 'string') {
      reports = reports.filter((r) => r.simulationId === simulationId)
    }
    if (generatedAfter && typeof generatedAfter === 'string') {
      const after = new Date(generatedAfter as string).getTime()
      reports = reports.filter((r) => new Date(r.generatedAt).getTime() > after)
    }

    reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())

    const pageNum = parseInt(page as string, 10)
    const sizeNum = parseInt(pageSize as string, 10)
    const startIdx = (pageNum - 1) * sizeNum
    const paged = reports.slice(startIdx, startIdx + sizeNum)

    const enriched = paged.map((r) => {
      const sim = mockData.simulations.find((s) => s.id === r.simulationId)
      return {
        ...r,
        simulationName: sim?.name,
        taskNo: sim?.taskNo,
      }
    })

    res.status(200).json({
      success: true,
      data: {
        items: enriched,
        total: reports.length,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil(reports.length / sizeNum),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取报告列表失败',
    })
  }
})

/**
 * GET /api/reports/:id
 * 获取单个报告详情
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const sim = mockData.simulations.find(
      (s) => s.reportId === id || `rpt_${s.id.slice(-8)}` === id
    )

    if (!sim) {
      res.status(404).json({
        success: false,
        error: `报告 ${id} 不存在`,
      })
      return
    }

    const report = buildReportFromSimulation(sim)
    const soilData = mockData.soilData.find((sd) => sd.id === sim.soilDataId)
    const warnings = sim.warnings.length
    const adjustments = sim.adjustmentLogs.length

    res.status(200).json({
      success: true,
      data: {
        report,
        context: {
          simulation: {
            id: sim.id,
            taskNo: sim.taskNo,
            name: sim.name,
            status: sim.status,
            progress: sim.currentProgress,
            parameters: sim.parameters,
            createdAt: sim.createdAt,
          },
          soilData: soilData ?? null,
          warningsCount: warnings,
          adjustmentsCount: adjustments,
          approvalsCount: sim.approvals.length,
        },
        figures: sim.status === 'COMPLETED'
          ? Object.keys(report.figures).map((key) => ({
              key,
              path: (report.figures as Record<string, string>)[key],
              title:
                key === 'carbonDecompositionCurve' ? '碳分解动态曲线' :
                key === 'communityCompositionStack' ? '微生物群落组成堆叠图' :
                key === 'enzymeActivityHeatmap' ? '关键胞外酶活性热力图' :
                '碳库储量时序趋势图',
            }))
          : [],
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取报告详情失败',
    })
  }
})

/**
 * POST /api/reports/:id/export
 * 导出报告为指定格式
 * Body: { format: 'pdf' | 'excel' | 'json' | 'zip', includeCharts?, includeAppendix?, watermark? }
 */
router.post('/:id/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const body = req.body as ExportBody

    const sim = mockData.simulations.find(
      (s) => s.reportId === id || `rpt_${s.id.slice(-8)}` === id
    )

    if (!sim) {
      res.status(404).json({
        success: false,
        error: `报告 ${id} 不存在`,
      })
      return
    }

    const validFormats = ['pdf', 'excel', 'json', 'zip']
    if (!body.format || !validFormats.includes(body.format)) {
      res.status(400).json({
        success: false,
        error: `format 必须是以下之一：${validFormats.join(', ')}`,
      })
      return
    }

    const report = buildReportFromSimulation(sim)
    const reportId = report.id
    const now = dayjs()
    const expiryDate = now.add(7, 'day').toISOString()

    const formatExt: Record<string, string> = {
      pdf: 'pdf',
      excel: 'xlsx',
      json: 'json',
      zip: 'zip',
    }

    const ext = formatExt[body.format]
    const fileName = `SoilSim_Report_${sim.taskNo}_${now.format('YYYYMMDD_HHmm')}.${ext}`
    const fileSize =
      body.format === 'pdf' ? 3.8 + Math.random() * 2.4 :
      body.format === 'excel' ? 1.2 + Math.random() * 0.8 :
      body.format === 'zip' ? 8.5 + Math.random() * 6.5 :
      0.5 + Math.random() * 0.5

    const downloadToken = `export_${reportId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const sectionsExported = [
      { key: 'summary', name: '模拟摘要数据', included: true },
      { key: 'charts', name: '可视化图表', included: body.includeCharts !== false },
      { key: 'microbes', name: '微生物物种清单', included: true },
      { key: 'carbon', name: '碳库动态数据', included: true },
      { key: 'enzymes', name: '酶活性数据集', included: true },
      { key: 'appendix', name: '调整日志与审批附录', included: body.includeAppendix !== false },
    ]

    res.status(200).json({
      success: true,
      data: {
        reportId,
        simulationId: sim.id,
        format: body.format,
        fileName,
        fileSize: `${fileSize.toFixed(2)} MB`,
        downloadUrl: `/api/reports/download/${downloadToken}`,
        downloadToken,
        expiresAt: expiryDate,
        watermark: body.watermark ?? null,
        sections: sectionsExported,
        createdAt: now.toISOString(),
      },
      message: `报告 ${reportId} 已生成 ${body.format.toUpperCase()} 格式文件，下载链接 7 日内有效`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '导出报告失败',
    })
  }
})

/**
 * GET /api/reports/download/:token
 * 下载导出文件（模拟重定向）
 */
router.get('/download/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params

    if (!token || !token.startsWith('export_')) {
      res.status(400).json({
        success: false,
        error: '无效的下载令牌',
      })
      return
    }

    const parts = token.split('_')
    const reportId = parts[1]

    res.status(200).json({
      success: true,
      data: {
        message: '（生产环境）此处将触发文件流下载',
        reportId,
        token,
        mockUrl: `https://cdn.soilsim.example.com/reports/${reportId}/download.zip`,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '文件下载失败',
    })
  }
})

export default router
