import { useState } from 'react';
import { Gauge, Save, RotateCcw, AlertTriangle, TrendingUp, Activity, Thermometer, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThresholdConfig {
  id: string;
  name: string;
  description: string;
  category: 'warning' | 'simulation' | 'quality';
  unit: string;
  min: number;
  max: number;
  warning: number;
  critical: number;
  icon: React.ElementType;
  color: string;
}

const initialThresholds: ThresholdConfig[] = [
  {
    id: 'co2-deviation',
    name: 'CO₂ 通量偏差阈值',
    description: '当模拟值与基线偏差超过此百分比时触发预警',
    category: 'warning',
    unit: '%',
    min: 1,
    max: 100,
    warning: 15,
    critical: 30,
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'enzyme-drop',
    name: '酶活性骤降阈值',
    description: '酶活性相对于上一时间点下降超过此百分比时触发',
    category: 'warning',
    unit: '%',
    min: 1,
    max: 100,
    warning: 25,
    critical: 50,
    icon: Activity,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'biomass-collapse',
    name: '微生物生物量崩溃阈值',
    description: '总微生物生物量低于初始值此百分比时触发严重预警',
    category: 'warning',
    unit: '%',
    min: 1,
    max: 100,
    warning: 40,
    critical: 20,
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'temp-optimal',
    name: '最适温度范围',
    description: '酶促反应和微生物生长的最适温度区间',
    category: 'simulation',
    unit: '°C',
    min: 0,
    max: 60,
    warning: 25,
    critical: 37,
    icon: Thermometer,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'moisture-optimal',
    name: '最适土壤湿度范围',
    description: '土壤持水量百分比的最佳区间',
    category: 'simulation',
    unit: '%',
    min: 0,
    max: 100,
    warning: 60,
    critical: 80,
    icon: Droplets,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'convergence',
    name: '收敛失败重试次数',
    description: '通量平衡分析收敛失败时的最大重试次数',
    category: 'quality',
    unit: '次',
    min: 1,
    max: 20,
    warning: 3,
    critical: 5,
    icon: Gauge,
    color: 'from-forest-500 to-teal-500',
  },
];

export default function ThresholdManagement() {
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>(initialThresholds);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (id: string, field: 'warning' | 'critical', value: number) => {
    setThresholds((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    setHasChanges(true);
  };

  const handleReset = () => {
    setThresholds(initialThresholds);
    setHasChanges(false);
  };

  const handleSave = () => {
    setHasChanges(false);
    alert('阈值配置已保存');
  };

  const categories = [
    { key: 'warning', label: '预警阈值', desc: '异常检测与预警触发配置' },
    { key: 'simulation', label: '模拟参数', desc: '模拟引擎运行参数配置' },
    { key: 'quality', label: '质量控制', desc: '算法收敛与数据质量配置' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-gradient flex items-center justify-center">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
              阈值配置管理
            </h1>
            <p className="text-sm text-slate-500 mt-1">配置系统预警阈值和模拟引擎参数</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-gradient text-white font-medium hover:shadow-lg hover:shadow-forest-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            保存更改
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const items = thresholds.filter((t) => t.category === cat.key);
        if (items.length === 0) return null;

        return (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
              <h2 className="text-lg font-display font-semibold text-slate-800 dark:text-white">
                {cat.label}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{cat.desc}</p>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((threshold, idx) => (
                <motion.div
                  key={threshold.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${threshold.color} flex items-center justify-center shrink-0 shadow-lg shadow-black/5`}>
                        <threshold.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          {threshold.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{threshold.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-500 whitespace-nowrap">警告阈值</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={threshold.min}
                            max={threshold.max}
                            value={threshold.warning}
                            onChange={(e) => handleChange(threshold.id, 'warning', Number(e.target.value))}
                            className="w-24 px-4 py-2 pr-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm font-semibold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600/60 dark:text-amber-400/60">
                            {threshold.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-500 whitespace-nowrap">严重阈值</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={threshold.min}
                            max={threshold.max}
                            value={threshold.critical}
                            onChange={(e) => handleChange(threshold.id, 'critical', Number(e.target.value))}
                            className="w-24 px-4 py-2 pr-8 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-semibold text-red-700 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600/60 dark:text-red-400/60">
                            {threshold.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pl-16">
                    <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full"
                        style={{ width: `${Math.min(100, (threshold.critical / threshold.max) * 100)}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md"
                        style={{ left: `${(threshold.warning / threshold.max) * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md"
                        style={{ left: `${(threshold.critical / threshold.max) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>{threshold.min} {threshold.unit}</span>
                      <span>{threshold.max} {threshold.unit}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
