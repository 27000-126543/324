import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
  Sprout,
  Leaf,
  Flame,
  TreePine,
  Mountain,
  Shovel,
  Ruler,
  Pickaxe,
  RotateCcw,
  CircleDot,
  Target,
  DollarSign,
  Check,
  Save,
  PlayCircle,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const soilTypes = [
  { id: 'black', name: '东北黑土', carbonBase: 1.8 },
  { id: 'red', name: '南方红壤', carbonBase: 1.2 },
  { id: 'loess', name: '黄土高原', carbonBase: 0.9 },
  { id: 'paddy', name: '水稻土', carbonBase: 2.1 },
  { id: 'brown', name: '华北褐土', carbonBase: 1.5 },
];

const amendments = [
  { id: 'straw', name: '秸秆还田', icon: Sprout, color: '#348260', unitPrice: 120, carbonFactor: 0.35 },
  { id: 'organic', name: '有机肥', icon: Leaf, color: '#B9952F', unitPrice: 450, carbonFactor: 0.42 },
  { id: 'biochar', name: '生物炭', icon: Flame, color: '#8B6914', unitPrice: 1200, carbonFactor: 0.85 },
  { id: 'green', name: '绿肥', icon: TreePine, color: '#579E7C', unitPrice: 80, carbonFactor: 0.28 },
  { id: 'lime', name: '石灰', icon: Mountain, color: '#7C3AED', unitPrice: 280, carbonFactor: 0.12 },
];

const tillageMethods = [
  { id: 'no-till', name: '免耕', icon: CircleDot, carbonValue: 0.8, desc: '零扰动，保留残茬', difficulty: 1 },
  { id: 'reduced', name: '少耕', icon: Ruler, carbonValue: 0.55, desc: '减少耕作次数', difficulty: 2 },
  { id: 'subsoiling', name: '深松', icon: Pickaxe, carbonValue: 0.42, desc: '30-40cm深层松土', difficulty: 3 },
  { id: 'plowing', name: '翻耕', icon: Shovel, carbonValue: 0.18, desc: '传统20cm翻耕', difficulty: 4 },
  { id: 'rotary', name: '旋耕', icon: RotateCcw, carbonValue: 0.3, desc: '10-15cm旋耕', difficulty: 2 },
];

export default function Recommendations() {
  const [soilType, setSoilType] = useState('black');
  const [targetCarbon, setTargetCarbon] = useState(6);
  const [budgetLimit, setBudgetLimit] = useState(8000);
  const [amendmentValues, setAmendmentValues] = useState<Record<string, number>>({
    straw: 3,
    organic: 2,
    biochar: 0.8,
    green: 1.5,
    lime: 0.5,
  });
  const [selectedTillage, setSelectedTillage] = useState('no-till');

  const soilInfo = soilTypes.find((s) => s.id === soilType)!;

  const amendmentStats = useMemo(() => {
    return amendments.map((a) => {
      const amount = amendmentValues[a.id] || 0;
      return {
        ...a,
        amount,
        cost: amount * a.unitPrice,
        carbonGain: amount * a.carbonFactor,
      };
    });
  }, [amendmentValues]);

  const totalCost = amendmentStats.reduce((sum, a) => sum + a.cost, 0);
  const totalAmendmentCarbon = amendmentStats.reduce((sum, a) => sum + a.carbonGain, 0);
  const tillageCarbon = tillageMethods.find((t) => t.id === selectedTillage)?.carbonValue || 0;
  const estimatedTotalCarbon = soilInfo.carbonBase + totalAmendmentCarbon + tillageCarbon;
  const confidence = Math.min(100, Math.max(20, 100 - Math.abs(targetCarbon - estimatedTotalCarbon) * 12 - Math.max(0, totalCost - budgetLimit) / 100));

  const stackedBarOption = useMemo(() => ({
    grid: { left: 48, right: 24, top: 40, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15,46,37,0.92)',
      borderColor: 'rgba(52,130,96,0.3)',
      textStyle: { color: '#DCECE3', fontFamily: 'IBM Plex Sans' },
      formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
        const total = params.reduce((s, p) => s + p.value, 0);
        return params.map((p) => `${p.marker}${p.seriesName}: ${p.value.toFixed(1)} t/ha (${((p.value / total) * 100).toFixed(1)}%)`).join('<br/>');
      },
    },
    legend: {
      data: amendments.map((a) => a.name),
      top: 0,
      right: 0,
      textStyle: { color: '#143D31', fontFamily: 'IBM Plex Sans', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
    },
    xAxis: {
      type: 'category',
      data: ['当前配比'],
      axisLine: { lineStyle: { color: 'rgba(27,77,62,0.1)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(27,77,62,0.7)', fontSize: 12, fontWeight: 500 },
    },
    yAxis: {
      type: 'value',
      name: 't/ha',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(27,77,62,0.06)', type: 'dashed' } },
      axisLabel: { color: 'rgba(27,77,62,0.55)', fontSize: 11, fontFamily: 'IBM Plex Sans' },
    },
    series: amendments.map((a) => ({
      name: a.name,
      type: 'bar',
      stack: 'total',
      barWidth: 80,
      emphasis: { focus: 'series' },
      itemStyle: { color: a.color, borderRadius: 0 },
      data: [amendmentValues[a.id] || 0],
    })),
  }), [amendmentValues]);

  const radarOption = useMemo(() => {
    const current = [
      Math.min(100, (estimatedTotalCarbon / 15) * 100),
      Math.min(100, ((budgetLimit - Math.max(0, totalCost - budgetLimit)) / budgetLimit) * 100),
      100 - tillageMethods.find((t) => t.id === selectedTillage)!.difficulty * 20,
      60 + (amendmentValues.biochar || 0) * 15 + (amendmentValues.organic || 0) * 8,
      50 + (amendmentValues.straw || 0) * 10 + (amendmentValues.green || 0) * 12,
      40 + (amendmentValues.biochar || 0) * 30 + (selectedTillage === 'no-till' ? 25 : 0),
    ];
    const best = [82, 78, 72, 88, 85, 90];
    const avg = [58, 62, 55, 60, 55, 52];

    return {
      tooltip: {
        backgroundColor: 'rgba(15,46,37,0.92)',
        borderColor: 'rgba(52,130,96,0.3)',
        textStyle: { color: '#DCECE3', fontFamily: 'IBM Plex Sans' },
      },
      legend: {
        data: ['当前方案', '历史最佳', '行业均值'],
        bottom: 0,
        textStyle: { color: '#143D31', fontFamily: 'IBM Plex Sans', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20,
      },
      radar: {
        center: ['50%', '48%'],
        radius: '65%',
        indicator: [
          { name: '固碳潜力', max: 100 },
          { name: '成本效益', max: 100 },
          { name: '实施难度', max: 100 },
          { name: '保水效果', max: 100 },
          { name: '微生物增益', max: 100 },
          { name: '长期稳定性', max: 100 },
        ],
        axisName: {
          color: '#143D31',
          fontSize: 12,
          fontFamily: 'IBM Plex Sans',
          fontWeight: 500,
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(52,130,96,0.02)', 'rgba(52,130,96,0.04)', 'rgba(52,130,96,0.06)', 'rgba(52,130,96,0.08)'],
          },
        },
        splitLine: { lineStyle: { color: 'rgba(27,77,62,0.15)' } },
        axisLine: { lineStyle: { color: 'rgba(27,77,62,0.2)' } },
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            name: '当前方案',
            value: current,
            lineStyle: { color: '#348260', width: 2.5 },
            itemStyle: { color: '#348260', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: 'rgba(52,130,96,0.22)' },
          },
          {
            name: '历史最佳',
            value: best,
            lineStyle: { color: '#B9952F', width: 2 },
            itemStyle: { color: '#B9952F', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: 'rgba(185,149,47,0.15)' },
          },
          {
            name: '行业均值',
            value: avg,
            lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' },
            itemStyle: { color: '#94a3b8', borderColor: '#fff', borderWidth: 2 },
            areaStyle: { opacity: 0 },
          },
        ],
      }],
    };
  }, [estimatedTotalCarbon, budgetLimit, totalCost, selectedTillage, amendmentValues]);

  const handleAmendmentChange = (id: string, value: number) => {
    setAmendmentValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">智能推荐引擎</h1>
            <p className="mt-1 text-forest-600/70">基于土壤参数与目标约束，AI 生成最优固碳管理方案</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-forest-gradient/10 text-forest-700 text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              实时计算中
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title">基础参数设置</div>
              <div className="section-subtitle">定义土壤条件与目标约束</div>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="input-label">土壤类型</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="input-field"
                >
                  {soilTypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}（本底碳 {s.carbonBase}%）
                    </option>
                  ))}
                </select>
                <p className="input-hint">不同土壤类型具有不同的有机碳本底值</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">目标固碳量</label>
                  <span className="text-sm font-semibold text-forest-700 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {targetCarbon.toFixed(1)} tC/ha
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={targetCarbon}
                  onChange={(e) => setTargetCarbon(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full bg-forest-100 accent-forest-500 cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-forest-600/50">
                  <span>0</span>
                  <span>7.5</span>
                  <span>15</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">预算限制</label>
                  <span className="text-sm font-semibold text-loam-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ¥{budgetLimit.toLocaleString()}/ha
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20000}
                  step={500}
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full bg-loam-100 accent-loam-500 cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-forest-600/50">
                  <span>¥0</span>
                  <span>¥10,000</span>
                  <span>¥20,000</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title">改良剂配比方案</div>
              <div className="section-subtitle">调整各改良剂施用量以匹配目标</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={cn(
                'px-3 py-1 rounded-full font-medium',
                totalCost <= budgetLimit ? 'bg-status-success/10 text-status-success' : 'bg-status-critical/10 text-status-critical'
              )}>
                总成本 ¥{totalCost.toFixed(0)}/ha
              </span>
              <span className="px-3 py-1 rounded-full bg-forest-gradient/10 text-forest-700 font-medium">
                预计固碳 +{totalAmendmentCarbon.toFixed(2)} tC/ha
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                {amendments.map((a) => {
                  const Icon = a.icon;
                  const val = amendmentValues[a.id] || 0;
                  const stat = amendmentStats.find((s) => s.id === a.id)!;
                  return (
                    <div key={a.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${a.color}15` }}
                          >
                            <Icon className="w-4.5 h-4.5" style={{ color: a.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-forest-800">{a.name}</div>
                            <div className="text-xs text-forest-600/50">碳汇因子 {a.carbonFactor} tC/t · ¥{a.unitPrice}/t</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-forest-700">{val.toFixed(1)} t/ha</div>
                          <div className="text-xs text-loam-600">¥{stat.cost.toFixed(0)}</div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.1}
                        value={val}
                        onChange={(e) => handleAmendmentChange(a.id, parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full bg-forest-100 cursor-pointer"
                        style={{ accentColor: a.color }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="h-80">
                <ReactECharts option={stackedBarOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title">耕作方式选择</div>
              <div className="section-subtitle">不同耕作方式对土壤碳储量影响差异显著</div>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {tillageMethods.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTillage === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTillage(t.id)}
                    className={cn(
                      'relative p-5 rounded-2xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-forest-500 bg-forest-gradient/5 shadow-card'
                        : 'border-forest-600/10 bg-white hover:border-forest-600/30 hover:shadow-card'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                        isSelected ? 'bg-forest-gradient text-white' : 'bg-forest-50 text-forest-600'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-forest-800">{t.name}</div>
                    <div className="text-xs text-forest-600/60 mt-0.5">{t.desc}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={cn(
                        'font-display font-bold',
                        isSelected ? 'text-forest-600' : 'text-forest-800'
                      )}>
                        +{t.carbonValue.toFixed(2)}
                      </span>
                      <span className="text-xs text-forest-600/50">tC/ha</span>
                    </div>
                    <div className="mt-1.5 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full',
                            i < t.difficulty ? 'bg-status-warning' : 'bg-forest-100'
                          )}
                        />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card card-hover"
        >
          <div className="card-header">
            <div>
              <div className="section-title">方案多维对比</div>
              <div className="section-subtitle">当前方案 vs 历史最佳 vs 行业基准</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-forest-500/10 to-forest-600/10 text-forest-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                综合得分 {(estimatedTotalCarbon / 15 * 50 + confidence / 100 * 50).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="h-96">
              <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card border-forest-500/30 bg-gradient-to-br from-forest-500/[0.04] via-white to-loam-500/[0.03]"
        >
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-forest-800">推荐置信度</div>
                    <div className="text-xs text-forest-600/60 mt-0.5">基于历史数据匹配度与约束满足度</div>
                  </div>
                  <span className={cn(
                    'font-display text-3xl font-bold',
                    confidence >= 80 ? 'text-status-success' : confidence >= 60 ? 'text-loam-600' : 'text-status-warning'
                  )}>
                    {confidence.toFixed(0)}%
                  </span>
                </div>
                <div className="h-4 rounded-full bg-forest-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={cn(
                      'h-full rounded-full',
                      confidence >= 80 ? 'bg-gradient-to-r from-forest-400 to-forest-500' :
                      confidence >= 60 ? 'bg-gradient-to-r from-loam-400 to-loam-500' :
                      'bg-gradient-to-r from-status-warning to-status-critical'
                    )}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-forest-600/10">
                  <div>
                    <div className="text-xs text-forest-600/60">预计总固碳</div>
                    <div className="mt-0.5 font-display text-xl font-bold text-forest-800">
                      {estimatedTotalCarbon.toFixed(2)} <span className="text-sm font-normal">tC/ha</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-forest-600/60">目标完成度</div>
                    <div className="mt-0.5 font-display text-xl font-bold text-forest-800">
                      {Math.min(100, (estimatedTotalCarbon / targetCarbon) * 100).toFixed(0)} <span className="text-sm font-normal">%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-forest-600/60">预算使用</div>
                    <div className={cn(
                      'mt-0.5 font-display text-xl font-bold',
                      totalCost <= budgetLimit ? 'text-forest-800' : 'text-status-critical'
                    )}>
                      {((totalCost / budgetLimit) * 100).toFixed(0)} <span className="text-sm font-normal">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button className="btn-primary w-full">
                  <Save className="w-4 h-4" />
                  保存方案
                </button>
                <button className="btn-secondary w-full">
                  <PlayCircle className="w-4 h-4" />
                  发起模拟验证
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
