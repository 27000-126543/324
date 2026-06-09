import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  AlertTriangle,
  AlertOctagon,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download,
  FileBarChart,
  Network,
  ShieldCheck,
  ScrollText,
  Activity,
  FlaskConical,
  ChevronRight,
  Send,
  X,
  Check,
  Edit3,
  Eye,
  Zap,
  ThermometerSun,
  Droplets,
  Bug,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { createAllMockData } from '@/mock/factory';
import { useAuthStore } from '@/stores/authStore';
import { useWarningStore } from '@/stores/warningStore';
import type {
  SimulationTask,
  SimulationStatus,
  SimulationStatusHistoryItem,
  WarningEvent as SharedWarningEvent,
  WarningLevel as SharedWarningLevel,
  AdjustmentLog,
  ApprovalRecord,
  ApprovalStage,
  ApprovalResult,
  SoilType,
} from '@shared/types';

dayjs.extend(duration);

const STATUS_ORDER: SimulationStatus[] = [
  'PENDING_VALIDATION',
  'NETWORK_BUILDING',
  'COMPONENT_INITIALIZING',
  'DECOMPOSITION_CALCULATING',
  'FLUX_ANALYZING',
  'COMPLETED',
  'EXCEPTION_FALLBACK',
];

const STATUS_LABELS: Record<SimulationStatus, string> = {
  PENDING_VALIDATION: '待校验',
  NETWORK_BUILDING: '网络构建',
  COMPONENT_INITIALIZING: '组分初始化',
  DECOMPOSITION_CALCULATING: '分解计算',
  FLUX_ANALYZING: '通量分析',
  COMPLETED: '完成',
  EXCEPTION_FALLBACK: '异常回退',
};

const STATUS_DESC: Record<SimulationStatus, string> = {
  PENDING_VALIDATION: '校验输入数据完整性与格式',
  NETWORK_BUILDING: '构建微生物代谢互作网络',
  COMPONENT_INITIALIZING: '初始化碳库、酶、物种参数',
  DECOMPOSITION_CALCULATING: '执行有机质分解动力学计算',
  FLUX_ANALYZING: '分析代谢通量与碳流分布',
  COMPLETED: '模拟计算完成，生成报告',
  EXCEPTION_FALLBACK: '检测异常，回退至稳定参数',
};

const WARNING_LEVEL_COLORS: Record<SharedWarningLevel, string> = {
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  WARNING: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

const WARNING_LEVEL_DOT: Record<SharedWarningLevel, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

const SOIL_TYPE_LABELS: Record<SoilType, string> = {
  黑土: '黑土',
  红壤: '红壤',
  黄壤: '黄壤',
  褐土: '褐土',
  潮土: '潮土',
  水稻土: '水稻土',
};

const ADJUSTMENT_TYPE_LABELS: Record<string, string> = {
  SUBSTRATE_ADD: '底物添加',
  INOCULUM_RATIO: '接种比例',
  PARAMETER_TWEAK: '参数微调',
  NETWORK_REBUILD: '网络重构',
};

const APPROVAL_STAGE_LABELS: Record<ApprovalStage, string> = {
  MICROBE_VALIDATION: '微生物验证',
  SOIL_HEALTH_EXPERT: '土壤健康评估',
};

const APPROVAL_RESULT_COLORS: Record<ApprovalResult, string> = {
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const APPROVAL_RESULT_LABELS: Record<ApprovalResult, string> = {
  APPROVED: '通过',
  REJECTED: '驳回',
  PENDING: '待审批',
};

type TabKey = 'monitor' | 'network' | 'approval' | 'logs';

const TABS: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
  { key: 'monitor', label: '实时监控', icon: Activity },
  { key: 'network', label: '代谢网络', icon: Network },
  { key: 'approval', label: '两级审批', icon: ShieldCheck },
  { key: 'logs', label: '调整日志', icon: ScrollText },
];

const mockData = createAllMockData();

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  const d = dayjs.duration(ms);
  if (d.asMinutes() < 1) return `${d.asSeconds().toFixed(0)}秒`;
  if (d.asHours() < 1) return `${d.asMinutes().toFixed(1)}分钟`;
  return `${d.asHours().toFixed(2)}小时`;
}

function StatusBadgeLocal({ status, size = 'md' }: { status: SimulationStatus; size?: 'sm' | 'md' | 'lg' }) {
  const isCompleted = status === 'COMPLETED';
  const isError = status === 'EXCEPTION_FALLBACK';
  const isRunning = !isCompleted && !isError && STATUS_ORDER.indexOf(status) > 0;
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  let colorCls = 'bg-gray-100 text-gray-700 border-gray-200';
  if (isCompleted) colorCls = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  else if (isError) colorCls = 'bg-rose-100 text-rose-700 border-rose-200';
  else if (isRunning) colorCls = 'bg-blue-100 text-blue-700 border-blue-200';
  else if (status === 'PENDING_VALIDATION') colorCls = 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap', colorCls, sizeCls)}>
      <span className={cn(
        'w-2 h-2 rounded-full shrink-0',
        isCompleted ? 'bg-emerald-500' : isError ? 'bg-rose-500' : isRunning ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
      )} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function TimelineNode({
  idx,
  status,
  history,
  isActive,
  isError,
  isCompleted,
  isFuture,
}: {
  idx: number;
  status: SimulationStatus;
  history: SimulationStatusHistoryItem[];
  isActive: boolean;
  isError: boolean;
  isCompleted: boolean;
  isFuture: boolean;
}) {
  const [hover, setHover] = useState(false);
  const item = history.find((h) => h.status === status);
  const hasCheck = isCompleted || (!isFuture && !isActive && !isError);

  return (
    <div
      className="relative flex gap-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex flex-col items-center">
        <div className={cn(
          'relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
          isError && status === 'EXCEPTION_FALLBACK'
            ? 'bg-rose-50 border-rose-400 text-rose-600'
            : isActive
            ? 'bg-blue-50 border-blue-500 text-blue-600 ring-4 ring-blue-100'
            : hasCheck
            ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
            : 'bg-white border-slate-200 text-slate-300'
        )}>
          {isError && status === 'EXCEPTION_FALLBACK' ? (
            <AlertOctagon className="w-4 h-4" />
          ) : isActive ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasCheck ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-3.5 h-3.5" />
          )}
        </div>
        {idx < STATUS_ORDER.length - 1 && (
          <div className={cn(
            'w-0.5 flex-1 min-h-[32px]',
            !isFuture ? 'bg-emerald-400' : 'bg-slate-200'
          )} />
        )}
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm font-medium',
            isActive ? 'text-blue-700' : hasCheck ? 'text-slate-800' : 'text-slate-400'
          )}>
            {STATUS_LABELS[status]}
          </span>
          {item?.timestamp && (
            <span className="text-[10px] text-slate-400 shrink-0">
              {dayjs(item.timestamp).format('HH:mm')}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{STATUS_DESC[status]}</p>
        <AnimatePresence>
          {hover && item?.durationMs !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] shadow-lg"
            >
              <Clock className="w-3 h-3" />
              耗时 {formatDuration(item.durationMs)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SimulationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { acknowledgeWarning, resolveWarning, getBySimulation } = useWarningStore();
  const [tab, setTab] = useState<TabKey>('monitor');
  const [approvalComments, setApprovalComments] = useState<Record<string, string>>({});
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});

  const task: SimulationTask | undefined = useMemo(() => {
    const found = mockData.simulations.find((s) => s.id === id);
    return found || mockData.simulations[0];
  }, [id]);

  const soilInfo = useMemo(() => {
    return mockData.soilData.find((s) => s.id === task?.soilDataId);
  }, [task]);

  const currentIdx = STATUS_ORDER.indexOf(task?.status || 'PENDING_VALIDATION');
  const isError = task?.status === 'EXCEPTION_FALLBACK';
  const isCompleted = task?.status === 'COMPLETED';

  const co2Option: EChartsOption = useMemo(() => {
    const data = task?.timeSeriesData || [];
    const times = data.map((d) => `${(d.timeHour / 24).toFixed(1)}d`);
    const co2 = data.map((d) => d.co2Flux);
    return {
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.95)', textStyle: { color: '#fff', fontSize: 12 } },
      grid: { left: 48, right: 20, top: 36, bottom: 36 },
      legend: { data: ['CO₂通量', '上限阈值', '下限阈值'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'mg C/m²/h', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        {
          name: 'CO₂通量',
          type: 'line',
          smooth: true,
          data: co2,
          lineStyle: { width: 2, color: '#10b981' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.35)' }, { offset: 1, color: 'rgba(16,185,129,0.02)' }] } },
          itemStyle: { color: '#10b981' },
          symbol: 'none',
        },
        {
          name: '上限阈值',
          type: 'line',
          data: data.map(() => task?.parameters.co2BaselineUpper || 4.5),
          lineStyle: { type: 'dashed', width: 1.5, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          symbol: 'none',
        },
        {
          name: '下限阈值',
          type: 'line',
          data: data.map(() => task?.parameters.co2BaselineLower || 2.0),
          lineStyle: { type: 'dashed', width: 1.5, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
          symbol: 'none',
        },
      ],
    };
  }, [task]);

  const biomassOption: EChartsOption = useMemo(() => {
    const data = task?.timeSeriesData || [];
    const microbes = task?.microbes?.slice(0, 5) || [];
    const times = data.map((d) => `${(d.timeHour / 24).toFixed(1)}d`);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    const series = microbes.map((m, idx) => ({
      name: m.genus,
      type: 'line' as const,
      stack: 'total',
      smooth: true,
      symbol: 'none',
      areaStyle: { opacity: 0.85 },
      lineStyle: { width: 1, color: colors[idx % colors.length] },
      itemStyle: { color: colors[idx % colors.length] },
      emphasis: { focus: 'series' as const },
      data: data.map((d) => {
        const raw = d.microbeAbundances?.[m.id];
        if (raw !== undefined) return raw;
        const seed = (m.id.charCodeAt(m.id.length - 1) + idx * 7 + d.timeHour) % 100;
        return +(m.relativeAbundance * (0.7 + (seed / 100) * 0.6) * Math.exp(-Math.pow((d.timeHour / 24 - 15) / 20, 2))).toFixed(3);
      }),
    }));
    return {
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.95)', textStyle: { color: '#fff', fontSize: 12 } },
      grid: { left: 48, right: 20, top: 36, bottom: 36 },
      legend: { top: 0, right: 0, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: times, boundaryGap: false, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '相对丰度(%)', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series,
    };
  }, [task]);

  const enzymeOption: EChartsOption = useMemo(() => {
    const data = task?.timeSeriesData || [];
    const enzymes = task?.enzymes || [];
    const times = data.map((d) => `${(d.timeHour / 24).toFixed(1)}d`);
    const colors = ['#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#f97316', '#ef4444'];
    const series = enzymes.map((e, idx) => ({
      name: e.enzymeName,
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: colors[idx % colors.length] },
      itemStyle: { color: colors[idx % colors.length] },
      emphasis: { focus: 'series' as const },
      data: data.map((d) => {
        const raw = d.enzymeActivities?.[e.id];
        if (raw !== undefined) return raw;
        const wave = Math.sin((d.timeHour / 24 + idx) * 0.8) * 0.15 + 1;
        return +(e.activity * wave * (0.85 + (idx % 3) * 0.1)).toFixed(2);
      }),
    }));
    return {
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.95)', textStyle: { color: '#fff', fontSize: 12 } },
      grid: { left: 48, right: 20, top: 36, bottom: 36 },
      legend: { top: 0, right: 0, textStyle: { fontSize: 11, color: '#64748b' }, type: 'scroll', pageIconSize: 10 },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '活性(U/g)', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series,
    };
  }, [task]);

  const warningsForSim: SharedWarningEvent[] = useMemo(() => {
    if (task?.warnings?.length) return task.warnings;
    const fromStore = getBySimulation(task?.id || '') as unknown as SharedWarningEvent[];
    return fromStore && fromStore.length ? fromStore : [];
  }, [task, getBySimulation]);

  const firstApproval = task?.approvals?.find((a) => a.stage === 'MICROBE_VALIDATION');
  const secondApproval = task?.approvals?.find((a) => a.stage === 'SOIL_HEALTH_EXPERT');

  const handleApprovalAction = (stage: ApprovalStage, result: ApprovalResult) => {
    const key = stage;
    const comment = approvalComments[key] || '';
    alert(`${result === 'APPROVED' ? '通过' : '驳回'}${APPROVAL_STAGE_LABELS[stage]}：${comment || '（无意见）'}`);
    setApprovalComments((p) => ({ ...p, [key]: '' }));
  };

  const handleReviewWarning = (wid: string) => {
    const comment = reviewInputs[wid] || '';
    if (user) resolveWarning(wid, user.id, user.realName, comment);
    setReviewInputs((p) => {
      const next = { ...p };
      delete next[wid];
      return next;
    });
  };

  return (
      <div className="flex gap-4 min-h-[calc(100vh-8rem)]">
        <aside className="w-[280px] shrink-0 flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex-1 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">执行状态</h3>
                <p className="text-[11px] text-slate-500">全流程时间轴</p>
              </div>
            </div>
            <div className="space-y-0.5">
              {STATUS_ORDER.map((s, i) => {
                const isActive = i === currentIdx && !isCompleted;
                const nodeError = isError && s === 'EXCEPTION_FALLBACK';
                return (
                  <TimelineNode
                    key={s}
                    idx={i}
                    status={s}
                    history={task?.statusHistory || []}
                    isActive={isActive}
                    isError={nodeError}
                    isCompleted={isCompleted ? i <= currentIdx : i < currentIdx}
                    isFuture={i > currentIdx}
                  />
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">任务编号</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{task?.taskNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">土壤类型</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {soilInfo ? SOIL_TYPE_LABELS[soilInfo.soilType] : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {task?.createdAt ? dayjs(task.createdAt).format('MM-DD HH:mm') : '-'}
                </span>
              </div>
            </div>
          </motion.div>
        </aside>

        <section className="flex-1 min-w-0 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-600/15 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {task?.name}
                      </h1>
                      <StatusBadgeLocal status={task?.status || 'PENDING_VALIDATION'} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ThermometerSun className="w-3 h-3" />
                        {soilInfo?.temperature}℃ · pH {soilInfo?.pH}
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        湿度 {soilInfo?.moisture}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Bug className="w-3 h-3" />
                        {task?.microbes?.length || 0} 物种 · {task?.enzymes?.length || 0} 酶
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">计算进度</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      {task?.currentProgress || 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task?.currentProgress || 0}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full relative overflow-hidden',
                        isError
                          ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-500'
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {!isCompleted && !isError && (
                  <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <Pause className="w-4 h-4" />
                    暂停
                  </button>
                )}
                <button
                  onClick={() => navigate('/metabolic-network', { state: { simId: task?.id } })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Network className="w-4 h-4" />
                  网络视图
                </button>
                <button
                  onClick={() => navigate(`/report/${task?.id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FileBarChart className="w-4 h-4" />
                  报告
                </button>
                {isCompleted && (
                  <button
                    onClick={() => alert('推荐方案已推送至农场管理系统')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    推送农场
                  </button>
                )}
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  重跑
                </button>
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-200 dark:border-slate-700 px-3 overflow-x-auto">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'relative inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.key === 'monitor' && warningsForSim.length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                        {warningsForSim.length}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="tab-active-line"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'monitor' && (
                <motion.div
                  key="monitor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 space-y-5"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-500/5 dark:to-slate-800">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        CO₂ 释放通量
                      </h4>
                      <div style={{ height: 220 }}>
                        <ReactECharts option={co2Option} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-500/5 dark:to-slate-800">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                        <Bug className="w-3.5 h-3.5 text-blue-600" />
                        微生物生物量
                      </h4>
                      <div style={{ height: 220 }}>
                        <ReactECharts option={biomassOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-500/5 dark:to-slate-800">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                        胞外酶活性
                      </h4>
                      <div style={{ height: 220 }}>
                        <ReactECharts option={enzymeOption} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'canvas' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        预警事件
                        {warningsForSim.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">
                            {warningsForSim.length}
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {warningsForSim.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                          <p className="text-sm text-slate-500">暂无预警事件，模拟运行平稳</p>
                        </div>
                      ) : (
                        warningsForSim.map((w) => (
                          <motion.div
                            key={w.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                w.level === 'CRITICAL' && 'bg-red-50 dark:bg-red-500/10 text-red-600',
                                w.level === 'WARNING' && 'bg-orange-50 dark:bg-orange-500/10 text-orange-600',
                                w.level === 'INFO' && 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
                              )}>
                                {w.level === 'CRITICAL' ? <AlertOctagon className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-medium text-slate-800 dark:text-white text-sm">{w.title}</h5>
                                      <span className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium',
                                        WARNING_LEVEL_COLORS[w.level]
                                      )}>
                                        <span className={cn('w-1.5 h-1.5 rounded-full', WARNING_LEVEL_DOT[w.level])} />
                                        {w.level}
                                      </span>
                                      {!w.resolved && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px]">
                                          偏离 {w.deviationPercent?.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{w.description}</p>
                                    <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                                      <span>H-{w.hourPoint}h</span>
                                      <span>基线: {w.baselineValue}</span>
                                      <span>实际: {w.actualValue}</span>
                                      <span>{dayjs(w.triggeredAt).format('MM-DD HH:mm')}</span>
                                    </div>
                                  </div>
                                </div>
                                {!w.resolved && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <input
                                        value={reviewInputs[w.id] || ''}
                                        onChange={(e) => setReviewInputs((p) => ({ ...p, [w.id]: e.target.value }))}
                                        placeholder="输入复核意见..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                      />
                                      <div className="flex gap-2 shrink-0">
                                        <button
                                          onClick={() => user && acknowledgeWarning(w.id, user.id, user.realName)}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                          <Eye className="w-4 h-4" />
                                          标记已知
                                        </button>
                                        <button
                                          onClick={() => handleReviewWarning(w.id)}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                        >
                                          <Check className="w-4 h-4" />
                                          复核通过
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {w.resolved && w.reviewComment && (
                                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">
                                    ✓ {w.reviewComment}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === 'network' && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-500/5 dark:to-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">网络节点</span>
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Circle className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {task?.network?.nodes?.length || 0}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        微生物 / 化合物 / 酶 / 反应
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-500/5 dark:to-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">网络边数</span>
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Network className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {task?.network?.edges?.length || 0}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        代谢 / 催化 / 生成 / 抑制 关系
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-violet-50/70 to-white dark:from-violet-500/5 dark:to-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">网络密度</span>
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-violet-600" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {task?.network?.nodes?.length
                          ? (((task.network.edges.length * 2) / (task.network.nodes.length * (task.network.nodes.length - 1))) * 100).toFixed(1)
                          : '0'}
                        <span className="text-base font-medium text-slate-400">%</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        实际连接 / 最大可能连接
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8 flex flex-col md:flex-row items-center justify-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-600/15 flex items-center justify-center">
                      <Network className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-center md:text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-white">代谢网络可视化</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        交互式 D3 力导向图，支持缩放、聚类、筛选、按丰度映射节点大小
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/metabolic-network', { state: { simId: task?.id } })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    >
                      打开网络视图
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {tab === 'approval' && (
                <motion.div
                  key="approval"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 space-y-5"
                >
                  <ApprovalCard
                    stage="MICROBE_VALIDATION"
                    order="一级审批"
                    title="微生物群落验证"
                    desc="由微生物验证者核查物种组成、丰度分布与质控指标"
                    approval={firstApproval}
                    comment={approvalComments['MICROBE_VALIDATION'] || ''}
                    onCommentChange={(v) => setApprovalComments((p) => ({ ...p, MICROBE_VALIDATION: v }))}
                    onApprove={() => handleApprovalAction('MICROBE_VALIDATION', 'APPROVED')}
                    onReject={() => handleApprovalAction('MICROBE_VALIDATION', 'REJECTED')}
                  />
                  <ApprovalCard
                    stage="SOIL_HEALTH_EXPERT"
                    order="二级审批"
                    title="土壤健康综合评估"
                    desc="由土壤健康专家综合评估碳库、酶活、通量指标合理性"
                    approval={secondApproval}
                    comment={approvalComments['SOIL_HEALTH_EXPERT'] || ''}
                    onCommentChange={(v) => setApprovalComments((p) => ({ ...p, SOIL_HEALTH_EXPERT: v }))}
                    onApprove={() => handleApprovalAction('SOIL_HEALTH_EXPERT', 'APPROVED')}
                    onReject={() => handleApprovalAction('SOIL_HEALTH_EXPERT', 'REJECTED')}
                  />
                </motion.div>
              )}

              {tab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-5"
                >
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">调整类型</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">触发预警</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">调整前</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">调整后</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">操作人</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">时间</th>
                            <th className="text-left font-medium px-4 py-3 whitespace-nowrap">备注</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {(!task?.adjustmentLogs?.length) ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                <Edit3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                暂无调整日志
                              </td>
                            </tr>
                          ) : (
                            task.adjustmentLogs.map((log: AdjustmentLog) => (
                              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium">
                                    {ADJUSTMENT_TYPE_LABELS[log.adjustmentType] || log.adjustmentType}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                                  {log.warningId ? warningsForSim.find((w) => w.id === log.warningId)?.title || log.warningId : '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <ParamChip data={log.beforeState} tone="before" />
                                </td>
                                <td className="px-4 py-3">
                                  <ParamChip data={log.afterState} tone="after" />
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                  {log.operatorName}
                                  <div className="text-[10px] text-slate-400">重跑 #{log.reSimulationCount}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                  {dayjs(log.appliedAt).format('MM-DD HH:mm')}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                                  {log.comment || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
  );
}

function ParamChip({ data, tone }: { data: Record<string, unknown>; tone: 'before' | 'after' }) {
  const entries = Object.entries(data).slice(0, 2);
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border',
            tone === 'before'
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
          )}
        >
          <span className="opacity-70">{k}:</span>
          <span className="font-semibold">{typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 14)}</span>
        </span>
      ))}
    </div>
  );
}

function ApprovalCard({
  stage,
  order,
  title,
  desc,
  approval,
  comment,
  onCommentChange,
  onApprove,
  onReject,
}: {
  stage: ApprovalStage;
  order: string;
  title: string;
  desc: string;
  approval?: ApprovalRecord;
  comment: string;
  onCommentChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = !approval || approval.result === 'PENDING';
  const isApproved = approval?.result === 'APPROVED';
  const isRejected = approval?.result === 'REJECTED';
  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-colors',
      isApproved ? 'border-green-200 dark:border-green-500/30 bg-gradient-to-br from-green-50/60 to-white dark:from-green-500/5 dark:to-slate-800'
        : isRejected ? 'border-red-200 dark:border-red-500/30 bg-gradient-to-br from-red-50/60 to-white dark:from-red-500/5 dark:to-slate-800'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            isApproved ? 'bg-green-500/10 text-green-600'
              : isRejected ? 'bg-red-500/10 text-red-600'
              : 'bg-amber-500/10 text-amber-600'
          )}>
            {isApproved ? <CheckCircle2 className="w-5 h-5" />
              : isRejected ? <X className="w-5 h-5" />
              : <Clock className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] font-semibold tracking-wide">
                {order}
              </span>
              <h4 className="font-semibold text-slate-800 dark:text-white">{title}</h4>
              {approval && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium',
                  APPROVAL_RESULT_COLORS[approval.result]
                )}>
                  {APPROVAL_RESULT_LABELS[approval.result]}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
            {approval && (
              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                <span>审批人：<b className="text-slate-700 dark:text-slate-200">{approval.approverName}</b> ({approval.approverRole})</span>
                {approval.decidedAt && (
                  <span>{dayjs(approval.decidedAt).format('MM-DD HH:mm')}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {approval?.comment && (
        <div className={cn(
          'mt-4 rounded-xl px-4 py-3 text-sm border',
          isApproved ? 'bg-green-50/70 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-200'
            : 'bg-red-50/70 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-200'
        )}>
          {approval.comment}
        </div>
      )}

      {isPending && (
        <div className="mt-4 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={`输入${APPROVAL_STAGE_LABELS[stage]}意见（可选）...`}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
              驳回
            </button>
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              <Check className="w-4 h-4" />
              通过
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
