import { useState, useMemo } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  GripVertical,
  Clock,
  User,
  FlaskConical,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Archive,
  Send,
  Zap,
  X,
  Download,
  Eye,
  Layers,
  Timer,
  FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LaneId = 'draft' | 'submitted' | 'running' | 'paused' | 'error' | 'done' | 'archived';

interface Lane {
  id: LaneId;
  label: string;
  desc: string;
  accent: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  border: string;
  dot: string;
}

interface Task {
  id: string;
  title: string;
  lane: LaneId;
  category: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  submittedAt: string;
  progress: number;
  eta?: string;
  sampleCount: number;
  tags: string[];
  owner: string;
}

const lanes: Lane[] = [
  { id: 'draft', label: '草稿', desc: '未提交的任务', accent: 'from-forest-400 to-forest-500', badge: 'badge-info', icon: FileBarChart, bg: 'bg-status-info/[0.07]', border: 'border-status-info/20', dot: 'bg-status-info' },
  { id: 'submitted', label: '已提交', desc: '等待调度', accent: 'from-loam-500 to-loam-400', badge: 'badge-pending', icon: Send, bg: 'bg-loam-500/[0.07]', border: 'border-loam-500/20', dot: 'bg-loam-500' },
  { id: 'running', label: '运行中', desc: '执行计算', accent: 'from-forest-500 to-status-success', badge: 'badge-info', icon: PlayCircle, bg: 'bg-forest-500/[0.08]', border: 'border-forest-500/25', dot: 'bg-forest-500' },
  { id: 'paused', label: '已暂停', desc: '手动暂停', accent: 'from-status-warning to-loam-500', badge: 'badge-warning', icon: PauseCircle, bg: 'bg-status-warning/[0.07]', border: 'border-status-warning/25', dot: 'bg-status-warning' },
  { id: 'error', label: '异常', desc: '执行失败', accent: 'from-status-critical to-status-warning', badge: 'badge-critical', icon: XCircle, bg: 'bg-status-critical/[0.06]', border: 'border-status-critical/25', dot: 'bg-status-critical' },
  { id: 'done', label: '已完成', desc: '任务成功', accent: 'from-status-success to-forest-500', badge: 'badge-success', icon: CheckCircle2, bg: 'bg-status-success/[0.07]', border: 'border-status-success/25', dot: 'bg-status-success' },
  { id: 'archived', label: '已归档', desc: '历史记录', accent: 'from-forest-600 to-forest-700', badge: 'badge-fallback', icon: Archive, bg: 'bg-forest-600/[0.05]', border: 'border-forest-600/20', dot: 'bg-forest-600' },
];

const initialTasks: Task[] = [
  { id: 'SIM-0498', title: '三江平原湿地微生物演替模拟', lane: 'draft', category: '群落演替', priority: 'medium', assignee: '李研究员', submittedAt: '06-09 10:24', progress: 0, sampleCount: 48, tags: ['16S', '湿地'], owner: '李研究员' },
  { id: 'SIM-0497', title: '华北农田氮肥利用率优化建模', lane: 'draft', category: '氮循环', priority: 'high', assignee: '王工程师', submittedAt: '06-09 08:47', progress: 0, sampleCount: 36, tags: ['氮循环', '农田'], owner: '王工程师' },
  { id: 'SIM-0496', title: '红壤酸化修复微生物组分析', lane: 'submitted', category: '功能注释', priority: 'high', assignee: '张研究员', submittedAt: '06-08 22:15', progress: 0, sampleCount: 64, tags: ['宏基因组', '酸化'], owner: '张研究员' },
  { id: 'SIM-0495', title: '黄土高原植被恢复固碳潜力评估', lane: 'submitted', category: '碳循环', priority: 'medium', assignee: '赵工程师', submittedAt: '06-08 19:32', progress: 0, sampleCount: 52, tags: ['固碳', '恢复'], owner: '赵工程师' },
  { id: 'SIM-0494', title: '东北黑土氮循环模拟 #B', lane: 'running', category: '氮循环', priority: 'high', assignee: '陈研究员', submittedAt: '06-08 14:08', progress: 74, eta: '约 42分', sampleCount: 128, tags: ['黑土', '氮循环'], owner: '陈研究员' },
  { id: 'SIM-0493', title: '水稻田甲烷排放耦合建模', lane: 'running', category: '温室气体', priority: 'medium', assignee: '刘工程师', submittedAt: '06-08 09:22', progress: 41, eta: '约 2小时', sampleCount: 96, tags: ['甲烷', '水稻'], owner: '刘工程师' },
  { id: 'SIM-0492', title: '海南砖红壤宏基因组从头组装', lane: 'running', category: '组装注释', priority: 'low', assignee: '周助理', submittedAt: '06-07 23:41', progress: 28, eta: '约 5.5小时', sampleCount: 24, tags: ['组装', '砖红壤'], owner: '周助理' },
  { id: 'SIM-0491', title: '西南喀斯特土壤微生物多样性', lane: 'paused', category: '多样性', priority: 'medium', assignee: '吴研究员', submittedAt: '06-07 16:55', progress: 56, sampleCount: 72, tags: ['喀斯特', 'α多样性'], owner: '吴研究员' },
  { id: 'SIM-0490', title: '内蒙古栗钙土磷素转化模拟', lane: 'paused', category: '磷循环', priority: 'low', assignee: '郑工程师', submittedAt: '06-07 11:03', progress: 19, sampleCount: 44, tags: ['磷循环', '草原'], owner: '郑工程师' },
  { id: 'SIM-0489', title: '干旱区荒漠土微生物网络分析', lane: 'error', category: '网络分析', priority: 'high', assignee: '孙研究员', submittedAt: '06-07 05:28', progress: 63, sampleCount: 32, tags: ['网络', '荒漠'], owner: '孙研究员' },
  { id: 'SIM-0488', title: '设施蔬菜大棚土壤抗生素抗性基因', lane: 'error', category: '抗性组', priority: 'medium', assignee: '钱工程师', submittedAt: '06-06 20:14', progress: 37, sampleCount: 88, tags: ['ARG', '大棚'], owner: '钱工程师' },
  { id: 'SIM-0487', title: '红壤宏基因组功能注释报告', lane: 'done', category: '功能注释', priority: 'high', assignee: '李研究员', submittedAt: '06-06 14:48', progress: 100, sampleCount: 156, tags: ['功能', 'KEGG'], owner: '李研究员' },
  { id: 'SIM-0486', title: '温带森林土壤碳氮计量学研究', lane: 'done', category: '碳循环', priority: 'medium', assignee: '王研究员', submittedAt: '06-05 17:33', progress: 100, sampleCount: 78, tags: ['森林', 'C:N'], owner: '王研究员' },
  { id: 'SIM-0485', title: '根际促生菌互作网络仿真', lane: 'done', category: '网络分析', priority: 'low', assignee: '赵助理', submittedAt: '06-05 09:12', progress: 100, sampleCount: 40, tags: ['PGPR', '互作'], owner: '赵助理' },
  { id: 'SIM-0484', title: '华北平原冬小麦土壤酶活性建模', lane: 'archived', category: '酶活性', priority: 'medium', assignee: '陈工程师', submittedAt: '06-01 15:40', progress: 100, sampleCount: 112, tags: ['酶活', '小麦'], owner: '陈工程师' },
  { id: 'SIM-0483', title: '长期定位施肥试验土壤微生物组', lane: 'archived', category: '群落结构', priority: 'high', assignee: '刘研究员', submittedAt: '05-28 10:05', progress: 100, sampleCount: 224, tags: ['长期试验', '施肥'], owner: '刘研究员' },
];

const categories = ['全部', '群落演替', '氮循环', '碳循环', '磷循环', '功能注释', '组装注释', '温室气体', '多样性', '网络分析', '抗性组', '酶活性', '群落结构'];
const priorityStyles = {
  high: { label: '高', badge: 'badge-critical' },
  medium: { label: '中', badge: 'badge-warning' },
  low: { label: '低', badge: 'badge-info' },
};

export default function SimulationList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = search === ''
        || t.title.toLowerCase().includes(search.toLowerCase())
        || t.id.toLowerCase().includes(search.toLowerCase())
        || t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
        || t.assignee.includes(search);
      const matchCategory = categoryFilter === '全部' || t.category === categoryFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchSearch && matchCategory && matchPriority;
    });
  }, [tasks, search, categoryFilter, priorityFilter]);

  const tasksByLane = useMemo(() => {
    const map: Record<LaneId, Task[]> = { draft: [], submitted: [], running: [], paused: [], error: [], done: [], archived: [] };
    filtered.forEach((t) => map[t.lane].push(t));
    return map;
  }, [filtered]);

  const updateTaskLane = (taskId: string, newLane: LaneId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, lane: newLane } : t))
    );
  };

  return (
    <div className="space-y-5 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
                模拟任务看板
              </h1>
              <span className="badge-info">
                <Layers className="w-3.5 h-3.5" />
                {tasks.length} 个任务
              </span>
            </div>
            <p className="mt-1 text-forest-600/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              支持拖拽卡片调整状态 · 泳道式全流程可视化
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn-secondary text-sm',
                showFilters && 'bg-forest-gradient/10 border-forest-500/30'
              )}
            >
              <Filter className="w-4 h-4" />
              筛选器
            </button>
            <button className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              新建模拟任务
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="card overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 lg:max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索任务名、ID、标签、负责人..."
                      className="input-field pl-11"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-forest-600/40 hover:text-forest-700 hover:bg-forest-600/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-forest-700 font-medium whitespace-nowrap">任务类型</span>
                      <div className="relative">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="input-field !py-2.5 text-sm pr-10 appearance-none min-w-[160px]"
                        >
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/50 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-forest-700 font-medium whitespace-nowrap">优先级</span>
                      <div className="flex rounded-xl border border-forest-600/15 overflow-hidden p-0.5 bg-white/70">
                        {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              priorityFilter === p
                                ? 'bg-forest-gradient text-white shadow-card'
                                : 'text-forest-700/70 hover:text-forest-700'
                            )}
                          >
                            {p === 'all' ? '全部' : priorityStyles[p].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(search !== '' || categoryFilter !== '全部' || priorityFilter !== 'all') && (
                      <button
                        onClick={() => { setSearch(''); setCategoryFilter('全部'); setPriorityFilter('all'); }}
                        className="btn-ghost text-xs py-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        重置
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-forest-600/10">
                  {lanes.map((lane) => {
                    const Icon = lane.icon;
                    return (
                      <div key={lane.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 border border-forest-600/10">
                        <Icon className={cn('w-3.5 h-3.5', lane.dot.replace('bg-', 'text-'))} />
                        <span className="text-xs font-medium text-forest-700/80">{lane.label}</span>
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md', lane.bg, lane.dot.replace('bg-', 'text-'))}>
                          {tasksByLane[lane.id].length}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-thin">
            {lanes.map((lane) => {
              const LaneIcon = lane.icon;
              const laneTasks = tasksByLane[lane.id];
              return (
                <motion.div
                  key={lane.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: lanes.indexOf(lane) * 0.05 }}
                  className="flex-shrink-0 w-80 lg:w-[22rem]"
                >
                  <div className={cn(
                    'rounded-2xl border overflow-hidden transition-all duration-200',
                    lane.bg,
                    lane.border,
                    activeCard === lane.id ? 'ring-2 ring-offset-2 ring-offset-cream ' + lane.dot.replace('bg-', 'ring-') : ''
                  )}>
                    <div className="px-4 py-3.5 border-b border-forest-600/10 flex items-center gap-3 bg-white/50 backdrop-blur-sm">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', lane.bg)}>
                        <LaneIcon className={cn('w-4.5 h-4.5', lane.dot.replace('bg-', 'text-'))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-forest-800 tracking-tight">{lane.label}</span>
                          <span className={cn('w-2 h-2 rounded-full', lane.dot, 'animate-pulse-slow')} />
                        </div>
                        <div className="text-xs text-forest-600/60">{lane.desc}</div>
                      </div>
                      <div className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold',
                        laneTasks.length > 0 ? lane.bg : 'bg-forest-600/10',
                        lane.dot.replace('bg-', 'text-')
                      )}>
                        {laneTasks.length}
                      </div>
                    </div>

                    <Reorder.Group
                      axis="y"
                      values={laneTasks}
                      onReorder={(newOrder) => {
                        const idsInLane = new Set(newOrder.map((t) => t.id));
                        setTasks((prev) => {
                          const others = prev.filter((t) => t.lane !== lane.id);
                          const updatedInLane = newOrder.map((t) => ({ ...t, lane: lane.id as LaneId }));
                          const allOthers = others.filter((t) => !idsInLane.has(t.id));
                          return [...allOthers, ...updatedInLane];
                        });
                      }}
                      className="flex flex-col gap-2.5 p-3 min-h-[400px]"
                    >
                      <AnimatePresence mode="popLayout">
                        {laneTasks.map((task) => {
                          const p = priorityStyles[task.priority];
                          return (
                            <Reorder.Item
                              key={task.id}
                              value={task}
                              onDragStart={() => setActiveCard(task.id)}
                              onDragEnd={() => setActiveCard(null)}
                              whileHover={{ y: -2 }}
                              whileDrag={{ scale: 1.03, boxShadow: '0 20px 40px -12px rgba(27,77,62,0.25)', zIndex: 50 }}
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                              className={cn(
                                'group relative rounded-2xl border bg-white/95 p-4 cursor-grab active:cursor-grabbing select-none shadow-card hover:shadow-cardHover transition-shadow',
                                activeCard === task.id ? 'border-forest-500/50' : 'border-forest-600/10 hover:border-forest-600/20'
                              )}
                              onClickCapture={(e) => {
                                if ((e.target as HTMLElement).closest('.no-drag')) e.stopPropagation();
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (task.lane !== lane.id) {
                                  // 视觉高亮
                                }
                              }}
                              onDrop={() => {
                                if (task.lane !== lane.id) {
                                  updateTaskLane(task.id, lane.id);
                                }
                              }}
                            >
                              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-70 rounded-t-2xl" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                              <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-80 bg-gradient-to-r', lane.accent)} />

                              <div className="flex items-start gap-2 -mt-0.5">
                                <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-forest-600/40" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-forest-gradient/10 text-forest-700 font-semibold">{task.id}</span>
                                      <span className={cn('badge', p.badge)}>{p.label}优先</span>
                                    </div>
                                    <button className="no-drag w-7 h-7 rounded-lg flex items-center justify-center text-forest-600/40 hover:text-forest-700 hover:bg-forest-600/10 transition-colors">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <h3 className="font-medium text-forest-800 leading-snug line-clamp-2 text-[0.95rem]">
                                    {task.title}
                                  </h3>

                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forest-gradient/[0.07] border border-forest-600/10 text-[11px] text-forest-700 font-medium">
                                      <FlaskConical className="w-3 h-3" />
                                      {task.category}
                                    </span>
                                    {task.tags.slice(0, 2).map((t) => (
                                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-loam-500/[0.08] border border-loam-500/20 text-[11px] text-loam-700 font-medium">
                                        <Tag className="w-3 h-3" />
                                        {t}
                                      </span>
                                    ))}
                                    {task.tags.length > 2 && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-forest-600/10 text-[11px] text-forest-600/70 font-medium">
                                        +{task.tags.length - 2}
                                      </span>
                                    )}
                                  </div>

                                  {lane.id === 'running' && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-forest-600/70 flex items-center gap-1">
                                          <Timer className="w-3 h-3" />
                                          进度 {task.progress}%
                                        </span>
                                        <span className="text-forest-700 font-medium flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {task.eta}
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-forest-600/10 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${task.progress}%` }}
                                          transition={{ duration: 0.6, ease: 'easeOut' }}
                                          className={cn('h-full rounded-full bg-gradient-to-r', lane.accent, 'relative overflow-hidden')}
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress" />
                                        </motion.div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-2 border-t border-forest-600/8">
                                    <div className="flex items-center gap-3 text-[11px] text-forest-600/65">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span className="truncate max-w-[72px]">{task.assignee}</span>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Layers className="w-3 h-3" />
                                        {task.sampleCount}样
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-drag">
                                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-forest-600/50 hover:text-forest-700 hover:bg-forest-600/10">
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      {lane.id === 'done' && (
                                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-status-success/70 hover:text-status-success hover:bg-status-success/10">
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {lane.id === 'error' && (
                                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-status-critical/70 hover:text-status-critical hover:bg-status-critical/10">
                                          <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          );
                        })}
                      </AnimatePresence>

                      {laneTasks.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex-1 flex flex-col items-center justify-center py-10 text-center rounded-xl border-2 border-dashed border-forest-600/10"
                        >
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-3', lane.bg)}>
                            <LaneIcon className={cn('w-6 h-6', lane.dot.replace('bg-', 'text-'), 'opacity-50')} />
                          </div>
                          <div className="text-sm text-forest-600/60">暂无任务</div>
                          <div className="text-xs text-forest-600/40 mt-1">拖拽卡片到此处</div>
                        </motion.div>
                      )}
                    </Reorder.Group>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <div className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-forest-600/70">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 w-6 h-6 rounded-lg bg-forest-gradient/10 text-forest-600 justify-center">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <span>拖动手柄图标可自由排序</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-forest-gradient/10 text-forest-600 text-[11px] font-medium">
                  <Zap className="w-3 h-3" />
                  拖拽状态
                </div>
                <span>跨泳道拖拽自动更新任务状态</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>当前筛选显示 <b className="text-forest-700">{filtered.length}</b> / {tasks.length} 个任务</span>
              <span className="hidden md:inline-block h-4 w-px bg-forest-600/15" />
              <span>刷新于 14:32:18</span>
            </div>
          </div>
        </div>
      </div>
  );
}
