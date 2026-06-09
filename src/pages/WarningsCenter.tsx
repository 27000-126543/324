import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Hand,
  AlertOctagon,
  AlertCircle,
  Info as InfoIcon,
  FileWarning,
  User,
  CheckCheck,
  Link as LinkIcon,
  Zap,
  Target,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { cn } from '@/lib/utils';
import { useWarningStore, WARNING_LEVEL_LABELS, WARNING_LEVEL_COLORS, WARNING_LEVEL_DOT_COLORS, WARNING_STATUS_LABELS, WARNING_STATUS_COLORS, WARNING_CATEGORY_LABELS, type WarningEvent } from '@/stores/warningStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type LevelFilter = 'all' | 'info' | 'low' | 'medium' | 'high' | 'critical';
type CategoryFilter = 'all' | WarningEvent['category'];
type ResolvedFilter = 'all' | 'resolved' | 'unresolved';

function LevelIcon({ level, className = '' }: { level: WarningEvent['level']; className?: string }) {
  if (level === 'critical') return <AlertOctagon className={cn('w-4 h-4', className)} />;
  if (level === 'high') return <XCircle className={cn('w-4 h-4', className)} />;
  if (level === 'medium') return <AlertTriangle className={cn('w-4 h-4', className)} />;
  if (level === 'low') return <AlertCircle className={cn('w-4 h-4', className)} />;
  return <InfoIcon className={cn('w-4 h-4', className)} />;
}

function BaselineBar({ baseline, actual, deviation }: { baseline: number; actual: number; deviation: number }) {
  const max = Math.max(baseline, actual) * 1.15 || 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-forest-600/60">基线: <b className="text-forest-700 font-mono">{baseline.toFixed(2)}</b></span>
        <span className={cn('font-mono font-semibold', deviation > 0 ? 'text-status-warning' : deviation < 0 ? 'text-status-critical' : 'text-status-success')}>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-forest-gradient/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-loam-400 to-loam-500/70 rounded-full" style={{ width: `${(baseline / max) * 100}%` }} />
        <div className={cn('absolute inset-y-0 left-0 rounded-full', deviation >= 0 ? 'bg-gradient-to-r from-status-warning/70 to-status-warning' : 'bg-gradient-to-r from-status-critical/70 to-status-critical')} style={{ width: `${Math.min(100, (actual / max) * 100)}%` }} />
        <div className="absolute inset-y-0" style={{ left: `${(baseline / max) * 100}%` }}>
          <div className="h-full w-0.5 bg-forest-800/60" />
          <div className="absolute -left-2 -top-2 text-[9px] font-bold text-forest-800">基线</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-forest-600/60">实际: <b className="text-forest-800 font-mono">{actual.toFixed(2)}</b></span>
      </div>
    </div>
  );
}

export default function WarningsCenter() {
  const { warnings, acknowledgeWarning, startProcessing, resolveWarning, getStats } = useWarningStore();
  const { user } = useAuthStore();
  const { showSuccess } = useUiStore();

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolveInput, setResolveInput] = useState('');

  const filtered = useMemo(() => {
    let result = warnings;
    if (levelFilter !== 'all') result = result.filter((w) => w.level === levelFilter);
    if (categoryFilter !== 'all') result = result.filter((w) => w.category === categoryFilter);
    if (resolvedFilter === 'resolved') result = result.filter((w) => w.status === 'resolved' || w.status === 'ignored');
    if (resolvedFilter === 'unresolved') result = result.filter((w) => w.status !== 'resolved' && w.status !== 'ignored');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) => w.title.toLowerCase().includes(q) || w.message.toLowerCase().includes(q) || (w.relatedSimulationName || '').toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (b.triggeredAt > a.triggeredAt ? 1 : -1));
  }, [warnings, levelFilter, categoryFilter, resolvedFilter, searchQuery]);

  const selected = useMemo(() => warnings.find((w) => w.id === selectedId) || filtered[0] || null, [warnings, selectedId, filtered]);

  const stats = getStats();

  const levelFilters: Array<{ key: LevelFilter; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'info', label: '提示' },
    { key: 'low', label: '低' },
    { key: 'medium', label: '中' },
    { key: 'high', label: '高' },
    { key: 'critical', label: '严重' },
  ];

  const categoryFilters: Array<{ key: CategoryFilter; label: string }> = [
    { key: 'all', label: '全部类型' },
    { key: 'parameter_anomaly', label: '参数异常' },
    { key: 'simulation_error', label: '模拟错误' },
    { key: 'system_alert', label: '系统提醒' },
    { key: 'data_threshold', label: '数据阈值' },
    { key: 'approval_timeout', label: '审批超时' },
    { key: 'resource_warning', label: '资源告警' },
  ];

  const computeDeviation = (w: WarningEvent): { baseline: number; actual: number; deviation: number; metric: string } => {
    if (w.metadata && typeof w.metadata === 'object' && 'baseline' in w.metadata && 'actual' in w.metadata) {
      return {
        baseline: Number((w.metadata as any).baseline) || 0,
        actual: Number((w.metadata as any).actual) || 0,
        deviation: Number((w.metadata as any).deviationPercent) || ((((w.metadata as any).actual as number) - ((w.metadata as any).baseline as number)) / (((w.metadata as any).baseline as number) || 1)) * 100,
        metric: String((w.metadata as any).metric || '指标'),
      };
    }
    const levelMap: Record<string, { baseline: number; actual: number; deviation: number; metric: string }> = {
      critical: { baseline: 6.5, actual: 5.2, deviation: -20, metric: 'pH 值' },
      high: { baseline: 25, actual: 18.5, deviation: -26, metric: '溶解氧(mg/L)' },
      medium: { baseline: 100, actual: 124, deviation: +24, metric: '任务时长(min)' },
      low: { baseline: 70, actual: 85, deviation: +21.4, metric: 'CPU 使用率(%)' },
      info: { baseline: 3.0, actual: 3.6, deviation: +20, metric: '生物量(g/L)' },
    };
    return levelMap[w.level] || levelMap.medium;
  };

  const handleAcknowledge = (id: string) => {
    if (!user) return;
    acknowledgeWarning(id, user.id, user.realName);
    showSuccess('预警已签收', '操作成功');
  };

  const handleStartProcess = (id: string) => {
    if (!user) return;
    startProcessing(id, user.id, user.realName);
    showSuccess('已开始处理预警', '操作成功');
  };

  const handleResolve = (id: string) => {
    if (!user || !resolveInput.trim()) return;
    resolveWarning(id, user.id, user.realName, resolveInput.trim());
    showSuccess('预警已标记为已解决', '操作成功');
    setResolveInput('');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">预警中心</h1>
          <p className="mt-1 text-forest-600/70">
            {stats.pending + stats.processing > 0
              ? `待处理预警 ${stats.pending + stats.processing} 条 · 严重 ${stats.critical} · 高 ${stats.high}`
              : '当前所有预警均已妥善处理'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-critical">
            <AlertOctagon className="w-3.5 h-3.5" />
            严重 {stats.critical}
          </span>
          <span className={cn('badge', WARNING_LEVEL_COLORS['high'])}>
            <XCircle className="w-3.5 h-3.5" />
            高 {stats.high}
          </span>
          <span className="badge-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            已解决 {stats.resolved}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card overflow-hidden"
      >
        <div className="border-b border-forest-600/10 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-forest-50 flex-wrap">
              <Filter className="w-4 h-4 text-forest-600/50 ml-2" />
              {levelFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLevelFilter(f.key)}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                    levelFilter === f.key
                      ? 'bg-white text-forest-700 shadow-sm'
                      : 'text-forest-600/60 hover:text-forest-700'
                  )}
                >
                  {f.key !== 'all' && <span className={cn('w-2 h-2 rounded-full', WARNING_LEVEL_DOT_COLORS[f.key as keyof typeof WARNING_LEVEL_DOT_COLORS])} />}
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-end flex-wrap">
              <div className="relative flex-1 sm:max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索预警标题、关联模拟..."
                  className="input-field pl-9 py-2 text-sm w-full"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="input-field !py-2 text-sm min-w-[150px]"
              >
                {categoryFilters.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-forest-50">
                {(['all', 'unresolved', 'resolved'] as ResolvedFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setResolvedFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                      resolvedFilter === f
                        ? 'bg-white text-forest-700 shadow-sm'
                        : 'text-forest-600/60 hover:text-forest-700'
                    )}
                  >
                    {f === 'all' ? '全部状态' : f === 'unresolved' ? '未解决' : '已解决'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-0 min-h-[620px]">
          <div className="xl:col-span-3 border-r border-forest-600/8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-forest-gradient/5 border-b border-forest-600/10 sticky top-0 backdrop-blur-sm bg-forest-50/90 z-10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">级别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">标题</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">关联模拟</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">触发时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">偏离</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-forest-700 tracking-wider uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 text-center"
                          >
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-forest-50 flex items-center justify-center mb-5">
                              <FileWarning className="w-10 h-10 text-forest-400" />
                            </div>
                            <div className="text-lg font-display font-semibold text-forest-800 mb-2">暂无预警</div>
                            <div className="text-sm text-forest-600/50">当前筛选条件下没有匹配的预警记录</div>
                          </motion.div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((w) => {
                        const dev = computeDeviation(w);
                        return (
                          <WarningRow
                            key={w.id}
                            warning={w}
                            isSelected={selected?.id === w.id}
                            onClick={() => setSelectedId(w.id)}
                            deviation={dev.deviation}
                          />
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-2 bg-gradient-to-b from-forest-gradient/[0.02] to-transparent">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-20 px-8 text-center"
                >
                  <div className="w-20 h-20 rounded-3xl bg-forest-gradient/10 flex items-center justify-center mb-5">
                    <AlertTriangle className="w-10 h-10 text-forest-500" />
                  </div>
                  <div className="font-display text-xl font-bold text-forest-800 mb-1">选择一条预警</div>
                  <div className="text-sm text-forest-600/60 max-w-xs">
                    在左侧表格中点击预警行，查看详细信息、指标偏离情况并执行处理操作
                  </div>
                </motion.div>
              ) : (
                <WarningDetailPanel
                  key={selected.id}
                  warning={selected}
                  deviation={computeDeviation(selected)}
                  onAcknowledge={() => handleAcknowledge(selected.id)}
                  onStartProcess={() => handleStartProcess(selected.id)}
                  onResolve={handleResolve}
                  resolveInput={resolveInput}
                  setResolveInput={setResolveInput}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WarningRow({
  warning,
  isSelected,
  onClick,
  deviation,
}: {
  warning: WarningEvent;
  isSelected: boolean;
  onClick: () => void;
  deviation: number;
}) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={onClick}
      className={cn(
        'border-b border-forest-600/6 cursor-pointer transition-colors',
        isSelected ? 'bg-forest-500/8' : 'hover:bg-forest-600/[0.03]',
        warning.status === 'resolved' && 'opacity-60'
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn('badge !py-1 text-[10px] !px-2 flex items-center gap-1', WARNING_LEVEL_COLORS[warning.level])}>
            <LevelIcon level={warning.level} />
            {WARNING_LEVEL_LABELS[warning.level]}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-forest-50 text-forest-700 font-medium">
          <Zap className="w-3 h-3 text-loam-500" />
          {WARNING_CATEGORY_LABELS[warning.category]}
        </span>
      </td>
      <td className="px-4 py-3.5 min-w-[220px]">
        <div className="text-sm font-semibold text-forest-800 line-clamp-1">{warning.title}</div>
        <div className="text-xs text-forest-600/60 mt-0.5 line-clamp-1">{warning.message}</div>
      </td>
      <td className="px-4 py-3.5 max-w-[180px]">
        {warning.relatedSimulationName ? (
          <div className="flex items-center gap-1 text-xs text-forest-700 truncate">
            <LinkIcon className="w-3 h-3 text-forest-500 flex-shrink-0" />
            <span className="truncate">{warning.relatedSimulationName}</span>
          </div>
        ) : (
          <span className="text-xs text-forest-600/30">-</span>
        )}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1 text-xs text-forest-600/70">
          <Clock className="w-3 h-3" />
          <span>{dayjs(warning.triggeredAt).fromNow()}</span>
        </div>
        <div className="text-[10px] text-forest-600/40 mt-0.5 font-mono">
          {dayjs(warning.triggeredAt).format('MM-DD HH:mm')}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn(
          'inline-flex items-center gap-0.5 text-xs font-bold font-mono px-2 py-0.5 rounded',
          deviation > 15 || deviation < -15 ? 'bg-status-critical/10 text-status-critical' : Math.abs(deviation) > 5 ? 'bg-status-warning/10 text-status-warning' : 'bg-status-success/10 text-status-success'
        )}>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="inline-flex items-center gap-1">
          <span className={cn('badge text-[10px]', WARNING_STATUS_COLORS[warning.status])}>
            {WARNING_STATUS_LABELS[warning.status]}
          </span>
          <ChevronRight className={cn('w-4 h-4 transition-transform', isSelected && 'translate-x-0.5 text-forest-600', 'text-forest-400')} />
        </div>
      </td>
    </motion.tr>
  );
}

function WarningDetailPanel({
  warning,
  deviation,
  onAcknowledge,
  onStartProcess,
  onResolve,
  resolveInput,
  setResolveInput,
}: {
  warning: WarningEvent;
  deviation: { baseline: number; actual: number; deviation: number; metric: string };
  onAcknowledge: () => void;
  onStartProcess: () => void;
  onResolve: (id: string) => void;
  resolveInput: string;
  setResolveInput: (s: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
      className="p-6 space-y-5 h-full"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          warning.level === 'critical' ? 'bg-status-critical/12' :
          warning.level === 'high' ? 'bg-status-warning/12' :
          warning.level === 'medium' ? 'bg-loam-500/12' :
          'bg-status-info/12'
        )}>
          <LevelIcon level={warning.level} className={cn(
            warning.level === 'critical' ? 'text-status-critical' :
            warning.level === 'high' ? 'text-status-warning' :
            warning.level === 'medium' ? 'text-loam-600' :
            'text-status-info'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-xl font-bold text-forest-800 tracking-tight">{warning.title}</h2>
            <span className={cn('badge !py-1 text-[10px]', WARNING_LEVEL_COLORS[warning.level])}>
              {WARNING_LEVEL_LABELS[warning.level]}
            </span>
            <span className={cn('badge text-[10px]', WARNING_STATUS_COLORS[warning.status])}>
              {WARNING_STATUS_LABELS[warning.status]}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-forest-600/60 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {dayjs(warning.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
            </span>
            <span>·</span>
            <span>来源: {warning.source}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-status-warning/[0.04] via-white to-status-critical/[0.03] border border-forest-600/10">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-status-warning mt-0.5 shrink-0" />
          <p className="text-sm text-forest-700 leading-relaxed">{warning.message}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-loam-600" />
          <span className="text-sm font-semibold text-forest-800">指标偏离分析</span>
          <span className="ml-auto text-xs text-forest-600/60 font-mono">{deviation.metric}</span>
        </div>
        <BaselineBar {...deviation} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {warning.relatedSimulationName && (
          <div className="p-3 rounded-xl border border-forest-600/10 bg-white/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-forest-600/50 mb-1.5">关联模拟</div>
            <div className="text-sm font-medium text-forest-800 truncate">{warning.relatedSimulationName}</div>
            <div className="mt-1 text-xs font-mono text-forest-600/60 truncate">{warning.relatedSimulationId}</div>
          </div>
        )}
        <div className="p-3 rounded-xl border border-forest-600/10 bg-white/80">
          <div className="text-[10px] uppercase font-bold tracking-wider text-forest-600/50 mb-1.5">预警类型</div>
          <div className="text-sm font-medium text-forest-800">{WARNING_CATEGORY_LABELS[warning.category]}</div>
          <div className="mt-1 text-xs text-forest-600/60">{warning.category}</div>
        </div>
      </div>

      {(warning.acknowledgedByName || warning.processingByName || warning.resolvedByName) && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-forest-700 flex items-center gap-2">
            <CheckCheck className="w-4 h-4" />
            处理轨迹
          </div>
          <div className="space-y-2">
            {warning.acknowledgedByName && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-forest-gradient/[0.04] border border-forest-600/8">
                <Hand className="w-4 h-4 text-forest-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-forest-800">已签收</div>
                  <div className="text-[11px] text-forest-600/60 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    {warning.acknowledgedByName}
                    <span>·</span>
                    {warning.acknowledgedAt && dayjs(warning.acknowledgedAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            )}
            {warning.processingByName && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-status-warning/[0.06] border border-status-warning/20">
                <Zap className="w-4 h-4 text-status-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-forest-800">处理中</div>
                  <div className="text-[11px] text-forest-600/60 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    {warning.processingByName}
                    <span>·</span>
                    {warning.processingStartedAt && dayjs(warning.processingStartedAt).format('MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            )}
            {warning.resolvedByName && (
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-status-success/[0.08] border border-status-success/20">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-forest-800">已解决</div>
                  <div className="text-[11px] text-forest-600/60 flex items-center gap-1.5 mb-1">
                    <User className="w-3 h-3" />
                    {warning.resolvedByName}
                    <span>·</span>
                    {warning.resolvedAt && dayjs(warning.resolvedAt).format('MM-DD HH:mm')}
                  </div>
                  {warning.resolutionNote && (
                    <div className="text-xs text-forest-700 leading-relaxed pt-1 border-t border-status-success/15 mt-1">
                      {warning.resolutionNote}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-forest-600/10 space-y-3">
        {warning.status === 'pending' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAcknowledge}
              className="btn-secondary text-sm py-2.5"
            >
              <Hand className="w-4 h-4" />
              签收预警
            </button>
            <button
              onClick={() => { onAcknowledge(); setTimeout(onStartProcess, 50); }}
              className="btn-primary text-sm py-2.5"
            >
              <Zap className="w-4 h-4" />
              签收并处理
            </button>
          </div>
        )}
        {warning.status === 'acknowledged' && (
          <button
            onClick={onStartProcess}
            className="w-full btn-primary text-sm py-2.5"
          >
            <Zap className="w-4 h-4" />
            开始处理此预警
          </button>
        )}
        {(warning.status === 'pending' || warning.status === 'acknowledged' || warning.status === 'processing') && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-forest-700">
              <ArrowRight className="w-4 h-4" />
              标记为已解决
            </div>
            <textarea
              value={resolveInput}
              onChange={(e) => setResolveInput(e.target.value)}
              rows={2}
              placeholder="请描述解决方案、处理过程或根因分析..."
              className="input-field !py-2.5 text-sm resize-none"
            />
            <button
              onClick={() => onResolve(warning.id)}
              disabled={!resolveInput.trim()}
              className="w-full btn-success text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交解决方案并关闭预警
            </button>
          </div>
        )}
        {warning.status === 'resolved' && (
          <div className="p-3 rounded-xl bg-status-success/8 border border-status-success/20 text-center">
            <CheckCircle2 className="w-5 h-5 text-status-success inline-block mb-1" />
            <div className="text-sm font-medium text-forest-800">预警已妥善解决</div>
            <div className="text-xs text-forest-600/60 mt-0.5">处理结果已存档至知识库</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
