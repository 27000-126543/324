import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Leaf,
  ListTodo,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  MoreHorizontal,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const kpiData = [
  {
    title: '模拟完成率',
    value: '87.4%',
    delta: '+5.2%',
    trend: 'up' as const,
    sub: '本月 214/245 个任务',
    icon: TrendingUp,
    gradient: 'from-forest-500 to-forest-600',
    bg: 'bg-forest-gradient/10',
    iconColor: 'text-forest-600',
    spark: [62, 68, 65, 74, 78, 82, 79, 85, 87],
  },
  {
    title: '平均响应时长',
    value: '2.48h',
    delta: '-18.3%',
    trend: 'down' as const,
    sub: '调度队列优化显著',
    icon: Clock,
    gradient: 'from-loam-500 to-loam-400',
    bg: 'bg-loam-gradient/10',
    iconColor: 'text-loam-600',
    spark: [4.2, 3.9, 4.1, 3.5, 3.2, 3.0, 2.8, 2.6, 2.48],
  },
  {
    title: '累计固碳增益',
    value: '1,284 t',
    delta: '+124 t',
    trend: 'up' as const,
    sub: '较上月 +10.7%',
    icon: Leaf,
    gradient: 'from-status-success to-forest-500',
    bg: 'bg-status-success/10',
    iconColor: 'text-status-success',
    spark: [820, 905, 980, 1040, 1095, 1150, 1198, 1240, 1284],
  },
  {
    title: '待处理任务',
    value: '37',
    delta: '+8',
    trend: 'flat' as const,
    sub: '12 项高优先级',
    icon: ListTodo,
    gradient: 'from-status-warning to-loam-500',
    bg: 'bg-status-warning/10',
    iconColor: 'text-status-warning',
    spark: [22, 25, 28, 24, 29, 31, 34, 33, 37],
  },
];

const recentTasks = [
  { id: 'SIM-2026-0482', name: '东北黑土氮循环模拟 #B', progress: 92, status: 'running' as const, eta: '32分钟', type: '氮循环' },
  { id: 'SIM-2026-0481', name: '红壤宏基因组功能注释', progress: 100, status: 'done' as const, eta: '已完成', type: '功能注释' },
  { id: 'SIM-2026-0480', name: '水稻田甲烷排放建模', progress: 64, status: 'running' as const, eta: '2小时14分', type: '温室气体' },
  { id: 'SIM-2026-0479', name: '黄土高原微生物多样性', progress: 28, status: 'queued' as const, eta: '排队中', type: '多样性' },
  { id: 'SIM-2026-0478', name: '林地土壤磷素转化模拟', progress: 0, status: 'paused' as const, eta: '已暂停', type: '磷循环' },
];

const statusStyles = {
  done: { badge: 'badge-success', label: '已完成', icon: CheckCircle2 },
  running: { badge: 'badge-info', label: '运行中', icon: PlayCircle },
  queued: { badge: 'badge-pending', label: '排队中', icon: Clock },
  paused: { badge: 'badge-warning', label: '已暂停', icon: PauseCircle },
  warning: { badge: 'badge-warning', label: '预警', icon: AlertTriangle },
};

export default function Dashboard() {
  const trendOption = useMemo(() => ({
    grid: { left: 48, right: 24, top: 32, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,46,37,0.92)',
      borderColor: 'rgba(52,130,96,0.3)',
      textStyle: { color: '#DCECE3', fontFamily: 'IBM Plex Sans' },
      axisPointer: { lineStyle: { color: 'rgba(52,130,96,0.3)' } },
    },
    legend: {
      data: ['本月完成率', '滚动均值'],
      top: 0,
      right: 0,
      textStyle: { color: '#143D31', fontFamily: 'IBM Plex Sans', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 20,
    },
    xAxis: {
      type: 'category',
      data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
      axisLine: { lineStyle: { color: 'rgba(27,77,62,0.1)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(27,77,62,0.55)', fontSize: 11, fontFamily: 'IBM Plex Sans' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(27,77,62,0.06)', type: 'dashed' } },
      axisLabel: { color: 'rgba(27,77,62,0.55)', fontSize: 11, fontFamily: 'IBM Plex Sans', formatter: '{value}%' },
    },
    series: [
      {
        name: '本月完成率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: [58, 63, 71, 68, 74, 79, 76, 82, 85, 83, 88, 87.4],
        lineStyle: { color: '#348260', width: 3 },
        itemStyle: { color: '#348260', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52,130,96,0.25)' },
              { offset: 1, color: 'rgba(52,130,96,0.02)' },
            ],
          },
        },
      },
      {
        name: '滚动均值',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: [60, 62, 65, 67, 70, 72, 74, 76, 78, 80, 83, 85],
        lineStyle: { color: '#B9952F', width: 2, type: 'dashed' },
      },
    ],
  }), []);

  const radarOption = useMemo(() => ({
    tooltip: {
      backgroundColor: 'rgba(15,46,37,0.92)',
      borderColor: 'rgba(52,130,96,0.3)',
      textStyle: { color: '#DCECE3', fontFamily: 'IBM Plex Sans' },
    },
    legend: {
      data: ['当前版本', '基线版本', '冗余阈值'],
      bottom: 0,
      textStyle: { color: '#143D31', fontFamily: 'IBM Plex Sans', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
    },
    radar: {
      center: ['50%', '45%'],
      radius: '65%',
      indicator: [
        { name: '碳循环', max: 100 },
        { name: '氮循环', max: 100 },
        { name: '磷循环', max: 100 },
        { name: '硫循环', max: 100 },
        { name: '甲烷代谢', max: 100 },
        { name: '胞外酶', max: 100 },
        { name: '重金属', max: 100 },
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
          name: '当前版本',
          value: [92, 88, 76, 68, 84, 72, 58],
          lineStyle: { color: '#348260', width: 2.5 },
          itemStyle: { color: '#348260', borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: 'rgba(52,130,96,0.22)' },
        },
        {
          name: '基线版本',
          value: [78, 74, 70, 62, 70, 66, 54],
          lineStyle: { color: '#B9952F', width: 2 },
          itemStyle: { color: '#B9952F', borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: 'rgba(185,149,47,0.15)' },
        },
        {
          name: '冗余阈值',
          value: [80, 80, 80, 80, 80, 80, 80],
          lineStyle: { color: 'rgba(192,57,43,0.6)', width: 1.5, type: 'dashed' },
          itemStyle: { color: 'rgba(192,57,43,0.6)' },
          areaStyle: { opacity: 0 },
        },
      ],
    }],
  }), []);

  const heatmapData = useMemo(() => {
    const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const data: Array<[number, number, number]> = [];
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < hours.length; j++) {
        let v = Math.round(Math.random() * 5);
        if (j >= 4 && j <= 10) v = Math.min(5, v + 2 + Math.round(Math.random() * 2));
        if (i >= 5) v = Math.max(0, v - 1);
        data.push([j, i, v]);
      }
    }
    return { hours, days, data };
  }, []);

  const heatmapOption = useMemo(() => ({
    grid: { left: 56, right: 24, top: 20, bottom: 36 },
    tooltip: {
      backgroundColor: 'rgba(15,46,37,0.92)',
      borderColor: 'rgba(52,130,96,0.3)',
      textStyle: { color: '#DCECE3', fontFamily: 'IBM Plex Sans' },
      formatter: (params: { name: string; value: number[]; data: number[] }) => {
        const [h, d, v] = params.value;
        const labels = ['无风险', '低风险', '中风险', '高风险', '严重', '紧急'];
        return `${heatmapData.days[d]} ${heatmapData.hours[h]}:00<br/><b style="color:#86BBA0">${labels[v] || '未知'}</b> · ${v}次预警`;
      },
    },
    xAxis: {
      type: 'category',
      data: heatmapData.hours.map((h) => `${h}:00`),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(27,77,62,0.55)', fontSize: 10, fontFamily: 'IBM Plex Sans' },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: heatmapData.days,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(27,77,62,0.7)', fontSize: 11, fontFamily: 'IBM Plex Sans', fontWeight: 500 },
    },
    visualMap: {
      min: 0,
      max: 5,
      show: false,
      inRange: {
        color: ['#DCECE3', '#86BBA0', '#DFBE66', '#E67E22', '#C0392B', '#7C3AED'],
      },
    },
    series: [{
      type: 'heatmap',
      data: heatmapData.data,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#F5F1E8',
        borderWidth: 2,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 8,
          shadowColor: 'rgba(27,77,62,0.3)',
        },
      },
    }],
  }), [heatmapData]);

  const pausedSoils = [
    { id: 'S-BH-042', name: '三江平原白浆土', reason: 'pH值异常', since: '2小时前', priority: 'high' },
    { id: 'S-HN-031', name: '海南砖红壤', reason: '数据缺失3项', since: '5小时前', priority: 'medium' },
    { id: 'S-SN-018', name: '陕北黄绵土', reason: '计算资源不足', since: '1天前', priority: 'low' },
  ];

  const priorityMap = {
    high: { badge: 'badge-critical', label: '高' },
    medium: { badge: 'badge-warning', label: '中' },
    low: { badge: 'badge-info', label: '低' },
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
              综合看板
            </h1>
            <p className="mt-1 text-forest-600/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              2026年6月9日 · 实时数据更新于 14:28:42
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm">
              <ChevronRight className="w-4 h-4 rotate-180" />
              上周
            </button>
            <div className="px-4 py-2 rounded-full bg-forest-gradient/10 text-forest-700 text-sm font-medium">
              2026年 第23周
            </div>
            <button className="btn-secondary text-sm">
              下周
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {kpiData.map((kpi, i) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus;
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={cn('kpi-card bg-card-texture bg-white/90')}
              >
                <div className={cn('absolute inset-0 opacity-40 bg-gradient-to-br', kpi.gradient, 'mask-fade-b')} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', kpi.bg)}>
                      <Icon className={cn('w-6 h-6', kpi.iconColor)} />
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      kpi.trend === 'up' && 'bg-status-success/10 text-status-success',
                      kpi.trend === 'down' && 'bg-status-success/10 text-status-success',
                      kpi.trend === 'flat' && 'bg-loam-500/10 text-loam-600',
                    )}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      {kpi.delta}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-forest-600/70 font-medium">{kpi.title}</div>
                    <div className="mt-1 font-display text-3xl font-bold text-forest-800 tracking-tight">
                      {kpi.value}
                    </div>
                    <div className="mt-1 text-xs text-forest-600/60">{kpi.sub}</div>
                  </div>
                  <div className="mt-4 h-10 flex items-end gap-1">
                    {kpi.spark.map((v, idx) => {
                      const max = Math.max(...kpi.spark);
                      const min = Math.min(...kpi.spark);
                      const h = ((v - min) / (max - min || 1)) * 100;
                      return (
                        <div
                          key={idx}
                          className={cn('flex-1 rounded-sm bg-gradient-to-t', kpi.gradient, 'opacity-70')}
                          style={{ height: `${Math.max(15, h)}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="xl:col-span-3 card card-hover"
          >
            <div className="card-header">
              <div>
                <div className="section-title">模拟完成率趋势</div>
                <div className="section-subtitle">近12周完成率波动与滚动均值</div>
              </div>
              <div className="flex items-center gap-2">
                <select className="px-3 py-1.5 rounded-lg text-sm border border-forest-600/15 bg-white text-forest-700">
                  <option>按周</option>
                  <option>按天</option>
                  <option>按月</option>
                </select>
                <button className="w-8 h-8 rounded-lg border border-forest-600/10 flex items-center justify-center text-forest-600/60 hover:text-forest-700">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="h-80">
                <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="xl:col-span-2 card card-hover"
          >
            <div className="card-header">
              <div>
                <div className="section-title">功能冗余雷达</div>
                <div className="section-subtitle">当前模型 vs 基线 · 7大生化通路</div>
              </div>
              <span className="badge-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                冗余度提升 18%
              </span>
            </div>
            <div className="card-body pt-2">
              <div className="h-80">
                <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="xl:col-span-2 card card-hover"
          >
            <div className="card-header">
              <div>
                <div className="section-title">预警热力图</div>
                <div className="section-subtitle">本周各时段任务预警密度</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-forest-600/70">
                <span className="w-3 h-3 rounded-sm" style={{ background: '#DCECE3' }} />
                <span>-</span>
                <span className="w-3 h-3 rounded-sm" style={{ background: '#C0392B' }} />
                <span className="ml-1">紧急</span>
              </div>
            </div>
            <div className="card-body">
              <div className="h-64">
                <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-forest-600/10">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-status-critical">23</div>
                  <div className="text-xs text-forest-600/60 mt-0.5">紧急预警</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-status-warning">86</div>
                  <div className="text-xs text-forest-600/60 mt-0.5">风险预警</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-status-success">1,247</div>
                  <div className="text-xs text-forest-600/60 mt-0.5">正常调度</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.57 }}
            className="xl:col-span-3 card card-hover"
          >
            <div className="card-header">
              <div>
                <div className="section-title">近期任务</div>
                <div className="section-subtitle">最近提交的模拟任务运行状态</div>
              </div>
              <button className="btn-ghost text-sm">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="card-body p-0">
              <div className="divide-y divide-forest-600/8">
                {recentTasks.map((task) => {
                  const style = statusStyles[task.status];
                  const StatusIcon = style.icon;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-forest-600/4 transition-colors"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        task.status === 'done' && 'bg-status-success/10',
                        task.status === 'running' && 'bg-status-info/10',
                        task.status === 'queued' && 'bg-loam-500/10',
                        task.status === 'paused' && 'bg-status-warning/10',
                      )}>
                        <StatusIcon className={cn(
                          'w-5 h-5',
                          task.status === 'done' && 'text-status-success',
                          task.status === 'running' && 'text-status-info animate-pulse',
                          task.status === 'queued' && 'text-loam-600',
                          task.status === 'paused' && 'text-status-warning',
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-forest-800 truncate">{task.name}</span>
                          <span className={cn('badge', style.badge)}>
                            {style.label}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-forest-600/60 flex items-center gap-2">
                          <span className="font-mono">{task.id}</span>
                          <span>·</span>
                          <span>{task.type}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block w-48">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-forest-600/60">{task.progress}%</span>
                          <span className="text-forest-600/60">{task.eta}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-forest-600/8 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              task.status === 'done' && 'bg-status-success',
                              task.status === 'running' && 'bg-forest-gradient animate-progress',
                              task.status === 'queued' && 'bg-loam-500/60',
                              task.status === 'paused' && 'bg-status-warning/60',
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-lg border border-forest-600/10 flex items-center justify-center text-forest-600/50 hover:text-forest-700 hover:border-forest-600/20 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="card border-status-warning/30 bg-gradient-to-br from-status-warning/[0.04] to-transparent"
        >
          <div className="card-header border-status-warning/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-warning/15 flex items-center justify-center">
                <PauseCircle className="w-5 h-5 text-status-warning" />
              </div>
              <div>
                <div className="section-title">暂停中的土壤样本</div>
                <div className="section-subtitle">共 {pausedSoils.length} 个样本需要您的关注处理</div>
              </div>
            </div>
            <span className="badge-critical">
              <AlertTriangle className="w-3.5 h-3.5" />
              2项高优先级
            </span>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pausedSoils.map((soil) => {
                const p = priorityMap[soil.priority as keyof typeof priorityMap];
                return (
                  <div
                    key={soil.id}
                    className="p-4 rounded-2xl border border-forest-600/10 bg-white/80 hover:border-forest-600/20 hover:shadow-card transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-forest-600/50">{soil.id}</div>
                        <div className="mt-0.5 font-medium text-forest-800">{soil.name}</div>
                      </div>
                      <span className={cn('badge', p.badge)}>{p.label}优先</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-forest-700">
                      <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />
                      <span className="truncate">{soil.reason}</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-forest-600/10 flex items-center justify-between">
                      <span className="text-xs text-forest-600/60">{soil.since}暂停</span>
                      <button className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        处理恢复
                        <ArrowUpRight className="w-3.5 h-3.5 -rotate-45" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
  );
}
