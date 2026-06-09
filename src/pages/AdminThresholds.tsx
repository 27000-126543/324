import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  Activity,
  AlertTriangle,
  Bell,
  Save,
  RefreshCw,
  Wind,
  Droplet,
  Thermometer,
  Leaf,
  Mountain,
  Sprout,
  Waves,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronDown,
  Settings,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoilType, WarningLevel } from '@shared/types';

interface Co2BaselinePreset {
  soilType: SoilType;
  lower: number;
  upper: number;
  description: string;
}

interface SuspendedSoil {
  id: string;
  name: string;
  soilType: SoilType;
  deviation: number;
  consecutiveCount: number;
  triggeredAt: string;
  simulationId: string;
}

interface ThresholdConfig {
  co2Baseline: {
    currentSoilType: SoilType;
    lower: number;
    upper: number;
  };
  enzymeDrop: {
    thresholdPercent: number;
    rollingWindowHours: number;
  };
  deviationSuspend: {
    consecutiveCount: number;
    deviationPercent: number;
    suspendedSoils: SuspendedSoil[];
  };
  notifications: {
    channels: Record<WarningLevel, { inApp: boolean; email: boolean; sms: boolean }>;
    slaMinutes: Record<WarningLevel, number>;
  };
}

const SOIL_TYPE_ICONS: Record<SoilType, React.ElementType> = {
  黑土: Mountain,
  红壤: Droplet,
  黄壤: Leaf,
  褐土: Thermometer,
  潮土: Waves,
  水稻土: Sprout,
};

const SOIL_TYPE_PRESETS: Co2BaselinePreset[] = [
  { soilType: '黑土', lower: 2.5, upper: 5.2, description: '东北黑土有机质丰富，CO₂通量基线较高' },
  { soilType: '红壤', lower: 1.2, upper: 3.8, description: '南方红壤酸性较强，微生物活性适中' },
  { soilType: '黄壤', lower: 1.5, upper: 4.0, description: '西南黄壤湿度较高，分解速率稳定' },
  { soilType: '褐土', lower: 1.8, upper: 4.2, description: '华北褐土钙质丰富，矿化作用强' },
  { soilType: '潮土', lower: 2.0, upper: 4.8, description: '冲积潮土水分充沛，微生物活跃' },
  { soilType: '水稻土', lower: 3.0, upper: 6.0, description: '水稻土厌氧环境，甲烷与CO₂共排放' },
];

const DEFAULT_CONFIG: ThresholdConfig = {
  co2Baseline: {
    currentSoilType: '黑土',
    lower: 2.5,
    upper: 5.2,
  },
  enzymeDrop: {
    thresholdPercent: 30,
    rollingWindowHours: 24,
  },
  deviationSuspend: {
    consecutiveCount: 3,
    deviationPercent: 15,
    suspendedSoils: [
      {
        id: 'soil_001',
        name: '三江平原白浆土试验田',
        soilType: '黑土',
        deviation: 23.8,
        consecutiveCount: 5,
        triggeredAt: '2026-06-09T06:15:00Z',
        simulationId: 'SIM-2026-0482',
      },
      {
        id: 'soil_003',
        name: '海南砖红壤橡胶林',
        soilType: '红壤',
        deviation: 18.2,
        consecutiveCount: 4,
        triggeredAt: '2026-06-08T22:30:00Z',
        simulationId: 'SIM-2026-0475',
      },
      {
        id: 'soil_005',
        name: '陕北黄绵土退耕区',
        soilType: '黄壤',
        deviation: 16.1,
        consecutiveCount: 3,
        triggeredAt: '2026-06-08T14:20:00Z',
        simulationId: 'SIM-2026-0470',
      },
    ],
  },
  notifications: {
    channels: {
      INFO: { inApp: true, email: false, sms: false },
      WARNING: { inApp: true, email: true, sms: false },
      CRITICAL: { inApp: true, email: true, sms: true },
    },
    slaMinutes: {
      INFO: 1440,
      WARNING: 240,
      CRITICAL: 30,
    },
  },
};

const WARNING_LEVEL_LABELS: Record<WarningLevel, string> = {
  INFO: '信息级',
  WARNING: '警告级',
  CRITICAL: '严重级',
};

const WARNING_LEVEL_COLORS: Record<WarningLevel, string> = {
  INFO: 'bg-status-info/10 text-status-info border-status-info/20',
  WARNING: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  CRITICAL: 'bg-status-critical/10 text-status-critical border-status-critical/20',
};

const STORAGE_KEY = 'threshold_config_v1';

export default function AdminThresholds() {
  const [config, setConfig] = useState<ThresholdConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activePresetTab, setActivePresetTab] = useState<SoilType>('黑土');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ThresholdConfig;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.warn('Failed to parse stored threshold config');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const saveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  const applyPreset = (preset: Co2BaselinePreset) => {
    setConfig((prev) => ({
      ...prev,
      co2Baseline: {
        currentSoilType: preset.soilType,
        lower: preset.lower,
        upper: preset.upper,
      },
    }));
    setActivePresetTab(preset.soilType);
  };

  const removeSuspendedSoil = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      deviationSuspend: {
        ...prev.deviationSuspend,
        suspendedSoils: prev.deviationSuspend.suspendedSoils.filter((s) => s.id !== id),
      },
    }));
  };

  const toggleNotificationChannel = (level: WarningLevel, channel: 'inApp' | 'email' | 'sms') => {
    setConfig((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channels: {
          ...prev.notifications.channels,
          [level]: {
            ...prev.notifications.channels[level],
            [channel]: !prev.notifications.channels[level][channel],
          },
        },
      },
    }));
  };

  const formatTimeAgo = (iso: string) => {
    const d = new Date(iso);
    const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (hours < 1) return `${Math.floor((Date.now() - d.getTime()) / 60000)} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  };

  const totalSuspended = config.deviationSuspend.suspendedSoils.length;

  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
                阈值配置中心
              </h1>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="badge-success"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已保存
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-1 text-forest-600/70 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              调整模拟引擎阈值、预警规则和通知策略 · 配置自动保存至本地
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="btn-secondary text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              恢复默认
            </button>
            <button
              onClick={saveAll}
              className="btn-primary text-sm"
            >
              <Save className="w-4 h-4" />
              保存全部配置
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title flex items-center gap-2">
                <Wind className="w-5 h-5 text-forest-500" />
                CO₂ 通量基线配置
              </div>
              <div className="section-subtitle">
                定义模拟中 CO₂ 释放速率的合理区间，超出范围触发预警 · 单位 μmol/m²/s
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-500/10 text-forest-700 text-xs font-medium">
              <Gauge className="w-3.5 h-3.5" />
              当前土壤：{config.co2Baseline.currentSoilType}
            </div>
          </div>
          <div className="card-body space-y-6">
            <div className="flex flex-wrap gap-2">
              {SOIL_TYPE_PRESETS.map((preset) => {
                const Icon = SOIL_TYPE_ICONS[preset.soilType];
                const isActive = activePresetTab === preset.soilType;
                return (
                  <button
                    key={preset.soilType}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                      isActive
                        ? 'bg-forest-gradient text-white border-transparent shadow-card'
                        : 'bg-white text-forest-700 border-forest-600/15 hover:border-forest-500/40 hover:bg-forest-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {preset.soilType}
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-md',
                      isActive ? 'bg-white/20 text-white' : 'bg-forest-500/10 text-forest-600'
                    )}>
                      {preset.lower}~{preset.upper}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-xl bg-forest-gradient/[0.04] border border-forest-500/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-forest-700/80">基线范围预览</span>
                <span className="font-mono text-sm font-bold text-forest-700">
                  {config.co2Baseline.lower.toFixed(1)} — {config.co2Baseline.upper.toFixed(1)} μmol/m²/s
                </span>
              </div>
              <div className="relative h-14 rounded-lg bg-gradient-to-r from-status-critical/30 via-status-success/50 to-status-critical/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 bg-gradient-to-r from-status-success to-forest-400 shadow-card"
                  style={{
                    left: `${(config.co2Baseline.lower / 8) * 100}%`,
                    width: `${((config.co2Baseline.upper - config.co2Baseline.lower) / 8) * 100}%`,
                  }}
                />
                {[0, 2, 4, 6, 8].map((v) => (
                  <div
                    key={v}
                    className="absolute top-0 bottom-0 w-px bg-white/50"
                    style={{ left: `${(v / 8) * 100}%` }}
                  >
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-forest-600/50 font-mono">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between text-xs text-forest-600/60">
                <span>下限过低预警区</span>
                <span className="text-status-success font-medium">安全区间</span>
                <span>上限过高预警区</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label !mb-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-warning" />
                    下限阈值 (Lower Bound)
                  </label>
                  <span className="font-mono text-lg font-bold text-status-warning">
                    {config.co2Baseline.lower.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.1}
                  value={config.co2Baseline.lower}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < config.co2Baseline.upper) {
                      setConfig((prev) => ({
                        ...prev,
                        co2Baseline: { ...prev.co2Baseline, lower: val },
                      }));
                    }
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-status-warning bg-gradient-to-r from-status-critical/40 to-status-warning/40"
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-forest-600/50 font-mono">
                  <span>0</span>
                  <span>3</span>
                  <span>6 μmol/m²/s</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label !mb-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-critical" />
                    上限阈值 (Upper Bound)
                  </label>
                  <span className="font-mono text-lg font-bold text-status-critical">
                    {config.co2Baseline.upper.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={0.1}
                  value={config.co2Baseline.upper}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > config.co2Baseline.lower) {
                      setConfig((prev) => ({
                        ...prev,
                        co2Baseline: { ...prev.co2Baseline, upper: val },
                      }));
                    }
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-status-critical bg-gradient-to-r from-status-warning/40 to-status-critical/40"
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-forest-600/50 font-mono">
                  <span>2</span>
                  <span>5</span>
                  <span>8 μmol/m²/s</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card card-hover"
          >
            <div className="card-header">
              <div>
                <div className="section-title flex items-center gap-2">
                  <Activity className="w-5 h-5 text-status-fallback" />
                  酶活性骤降阈值
                </div>
                <div className="section-subtitle">
                  检测胞外酶活性短时间内异常下跌，触发微生物生态平衡预警
                </div>
              </div>
            </div>
            <div className="card-body space-y-7">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label !mb-0">骤降判定百分比</label>
                  <span className="px-3 py-1 rounded-full bg-status-fallback/10 text-status-fallback font-mono font-bold text-lg">
                    -{config.enzymeDrop.thresholdPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={70}
                  step={1}
                  value={config.enzymeDrop.thresholdPercent}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    enzymeDrop: { ...prev.enzymeDrop, thresholdPercent: parseInt(e.target.value) },
                  }))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-status-fallback bg-gradient-to-r from-status-fallback/20 to-status-fallback/50"
                />
                <div className="mt-2 flex justify-between text-xs text-forest-600/60">
                  <span className="text-status-success">宽松 -10%</span>
                  <span className={config.enzymeDrop.thresholdPercent === 30 ? 'text-forest-600 font-medium' : ''}>
                    推荐 -30%
                  </span>
                  <span className="text-status-critical">严格 -70%</span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-forest-600/15 to-transparent" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label !mb-0 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-forest-500" />
                    滚动统计窗口
                  </label>
                  <span className="px-3 py-1 rounded-full bg-forest-500/10 text-forest-700 font-mono font-bold text-lg">
                    {config.enzymeDrop.rollingWindowHours}h
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={96}
                  step={6}
                  value={config.enzymeDrop.rollingWindowHours}
                  onChange={(e) => setConfig((prev) => ({
                    ...prev,
                    enzymeDrop: { ...prev.enzymeDrop, rollingWindowHours: parseInt(e.target.value) },
                  }))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-forest-500 bg-gradient-to-r from-forest-500/20 to-forest-500/50"
                />
                <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] text-forest-600/50 font-mono text-center">
                  {[6, 24, 48, 72, 96].map((h) => (
                    <div
                      key={h}
                      className={cn(
                        'py-1 rounded-md',
                        config.enzymeDrop.rollingWindowHours === h
                          ? 'bg-forest-500/15 text-forest-700 font-semibold'
                          : ''
                      )}
                    >
                      {h}h
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-status-fallback/5 border border-status-fallback/15">
                <div className="text-xs text-forest-700/80 leading-relaxed">
                  <span className="font-semibold">触发逻辑：</span>
                  若任意关键胞外酶在连续 <b className="text-forest-700">{config.enzymeDrop.rollingWindowHours} 小时</b> 窗口内活性较基线下跌超过{' '}
                  <b className="text-status-fallback">{config.enzymeDrop.thresholdPercent}%</b>，系统将立即触发 ENZYME_DROP 级预警并推送相关人员复核。
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="card card-hover border-status-warning/25 bg-gradient-to-br from-status-warning/[0.03] to-transparent"
          >
            <div className="card-header border-status-warning/20">
              <div>
                <div className="section-title flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-status-warning" />
                  偏差自动暂停规则
                </div>
                <div className="section-subtitle">
                  CO₂ 通量持续超偏差时自动暂停该土壤相关模拟，防止错误传播
                </div>
              </div>
              {totalSuspended > 0 && (
                <span className="badge-critical">
                  <PauseCircle className="w-3.5 h-3.5" />
                  {totalSuspended} 项已暂停
                </span>
              )}
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-medium text-forest-700/80">连续次数 N</label>
                    <span className="px-2.5 py-0.5 rounded-full bg-status-warning/10 text-status-warning font-mono font-bold">
                      {config.deviationSuspend.consecutiveCount} 次
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={config.deviationSuspend.consecutiveCount}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      deviationSuspend: {
                        ...prev.deviationSuspend,
                        consecutiveCount: parseInt(e.target.value),
                      },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-status-warning bg-status-warning/20"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-forest-600/50">
                    <span>2次</span>
                    <span>6次</span>
                    <span>10次</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-medium text-forest-700/80">偏差阈值 %</label>
                    <span className="px-2.5 py-0.5 rounded-full bg-status-critical/10 text-status-critical font-mono font-bold">
                      {config.deviationSuspend.deviationPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={1}
                    value={config.deviationSuspend.deviationPercent}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      deviationSuspend: {
                        ...prev.deviationSuspend,
                        deviationPercent: parseInt(e.target.value),
                      },
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-status-critical bg-status-critical/20"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-forest-600/50">
                    <span>5%</span>
                    <span>15% ⭐</span>
                    <span>40%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/70 border border-forest-600/10">
                <div className="text-xs text-forest-700/80">
                  <span className="font-semibold">规则：</span>
                  同一样本的 CO₂ 通量连续 <b className="text-status-warning">{config.deviationSuspend.consecutiveCount}</b> 次读数超出基线{' '}
                  <b className="text-status-critical">±{config.deviationSuspend.deviationPercent}%</b>，自动将该土壤ID加入暂停列表，后续模拟任务均被拦截。
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-forest-800 flex items-center gap-2">
                    <PauseCircle className="w-4 h-4 text-status-warning" />
                    当前暂停列表
                  </h4>
                  <span className="text-xs text-forest-600/60">
                    共 {totalSuspended} 项
                  </span>
                </div>
                {config.deviationSuspend.suspendedSoils.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border-2 border-dashed border-forest-600/10 bg-forest-50/30">
                    <CheckCircle2 className="w-10 h-10 text-status-success/60 mx-auto mb-2" />
                    <div className="text-sm text-forest-600/70">当前无暂停的土壤样本</div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {config.deviationSuspend.suspendedSoils.map((soil) => {
                      const Icon = SOIL_TYPE_ICONS[soil.soilType];
                      return (
                        <motion.div
                          key={soil.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-white/80 border border-status-warning/20 hover:border-status-warning/40 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-status-warning" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-forest-800 truncate">
                                {soil.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-forest-500/10 text-forest-600 text-[10px] font-medium">
                                {soil.soilType}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-forest-600/70">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-status-critical" />
                                偏差 <b className="text-status-critical">+{soil.deviation}%</b>
                              </span>
                              <span>·</span>
                              <span>连续 {soil.consecutiveCount} 次</span>
                              <span>·</span>
                              <span className="font-mono">{soil.simulationId}</span>
                              <span>·</span>
                              <span>{formatTimeAgo(soil.triggeredAt)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeSuspendedSoil(soil.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-status-success border border-status-success/25 bg-status-success/5 hover:bg-status-success/10 hover:border-status-success/40 transition-colors"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            解除暂停
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title flex items-center gap-2">
                <Bell className="w-5 h-5 text-loam-500" />
                预警通知配置
              </div>
              <div className="section-subtitle">
                按预警级别配置通知渠道和响应时效 SLA，确保关键问题不遗漏
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-forest-600/10">
                    <th className="text-left pb-4 pr-6">
                      <div className="text-xs font-semibold text-forest-700/80 uppercase tracking-wider">
                        预警级别
                      </div>
                    </th>
                    <th className="text-center pb-4 px-4">
                      <div className="inline-flex flex-col items-center gap-1">
                        <MessageSquare className="w-4.5 h-4.5 text-forest-600" />
                        <span className="text-xs font-medium text-forest-700/80">站内通知</span>
                      </div>
                    </th>
                    <th className="text-center pb-4 px-4">
                      <div className="inline-flex flex-col items-center gap-1">
                        <Mail className="w-4.5 h-4.5 text-forest-600" />
                        <span className="text-xs font-medium text-forest-700/80">邮件推送</span>
                      </div>
                    </th>
                    <th className="text-center pb-4 px-4">
                      <div className="inline-flex flex-col items-center gap-1">
                        <Smartphone className="w-4.5 h-4.5 text-forest-600" />
                        <span className="text-xs font-medium text-forest-700/80">短信提醒</span>
                      </div>
                    </th>
                    <th className="text-center pb-4 pl-6">
                      <div className="inline-flex flex-col items-center gap-1">
                        <Clock className="w-4.5 h-4.5 text-forest-600" />
                        <span className="text-xs font-medium text-forest-700/80">响应时效 SLA</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-600/8">
                  {(['INFO', 'WARNING', 'CRITICAL'] as WarningLevel[]).map((level) => {
                    const ch = config.notifications.channels[level];
                    const sla = config.notifications.slaMinutes[level];
                    const formatSla = (m: number) => {
                      if (m < 60) return `${m} 分钟`;
                      if (m < 1440) return `${m / 60} 小时`;
                      return `${m / 1440} 天`;
                    };
                    return (
                      <tr key={level} className="hover:bg-forest-600/3 transition-colors">
                        <td className="py-5 pr-6">
                          <span className={cn(
                            'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium',
                            WARNING_LEVEL_COLORS[level]
                          )}>
                            <AlertTriangle className={cn(
                              'w-4 h-4',
                              level === 'CRITICAL' && 'animate-pulse'
                            )} />
                            {WARNING_LEVEL_LABELS[level]}
                          </span>
                          <div className="mt-2 text-xs text-forest-600/60 max-w-[240px]">
                            {level === 'INFO' && '系统状态变更、模拟完成通知等一般信息'}
                            {level === 'WARNING' && '参数偏差、轻微异常等需要关注的事件'}
                            {level === 'CRITICAL' && '关键指标超限、模拟失败等紧急事件需立即处理'}
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <label className="inline-flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={ch.inApp}
                              onChange={() => toggleNotificationChannel(level, 'inApp')}
                              className="w-5 h-5 rounded-md border-2 accent-forest-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <label className="inline-flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={ch.email}
                              onChange={() => toggleNotificationChannel(level, 'email')}
                              className="w-5 h-5 rounded-md border-2 accent-forest-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <label className="inline-flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={ch.sms}
                              onChange={() => toggleNotificationChannel(level, 'sms')}
                              disabled={level === 'INFO'}
                              className={cn(
                                'w-5 h-5 rounded-md border-2 accent-forest-500 cursor-pointer',
                                level === 'INFO' && 'opacity-40 cursor-not-allowed'
                              )}
                            />
                          </label>
                        </td>
                        <td className="py-5 pl-6">
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-mono text-sm font-bold text-forest-800 min-w-[72px] text-center">
                              {formatSla(sla)}
                            </span>
                            <div className="relative w-36">
                              <input
                                type="range"
                                min={level === 'INFO' ? 120 : level === 'WARNING' ? 30 : 5}
                                max={level === 'INFO' ? 4320 : level === 'WARNING' ? 1440 : 240}
                                step={level === 'INFO' ? 60 : level === 'WARNING' ? 30 : 5}
                                value={sla}
                                onChange={(e) => setConfig((prev) => ({
                                  ...prev,
                                  notifications: {
                                    ...prev.notifications,
                                    slaMinutes: {
                                      ...prev.notifications.slaMinutes,
                                      [level]: parseInt(e.target.value),
                                    },
                                  },
                                }))}
                                className={cn(
                                  'w-full h-1.5 rounded-full appearance-none cursor-pointer',
                                  level === 'INFO' && 'accent-status-info bg-status-info/20',
                                  level === 'WARNING' && 'accent-status-warning bg-status-warning/20',
                                  level === 'CRITICAL' && 'accent-status-critical bg-status-critical/20'
                                )}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-loam-500/5 border border-loam-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-forest-700/80 flex items-start gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-status-success flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">通知策略已就绪。</span>
                  响应时效超时将自动升级至上级主管，未签收预警需在看板中高亮显示。
                </div>
              </div>
              <button className="btn-secondary text-xs !py-2 whitespace-nowrap">
                <Bell className="w-3.5 h-3.5" />
                发送测试通知
              </button>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
