import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ChevronRight,
  Filter,
  Search,
  ThumbsUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Beaker,
  Leaf,
  Send,
  X,
  CircleDot,
  Star,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { cn } from '@/lib/utils';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
import {
  useApprovalStore,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  ApprovalRecord,
} from '@/stores/approvalStore';
import { useAuthStore } from '@/stores/authStore';

type ApprovalTab = 'first' | 'second';

const metabolicAssessmentItems = [
  { id: 'pathway', name: '代谢通路完整性', icon: Activity, desc: '关键生化通路覆盖度与连接性' },
  { id: 'thermo', name: '热力学可行性', icon: BarChart3, desc: '自由能变化与反应方向合理性' },
  { id: 'kinetics', name: '动力学参数合理性', icon: Beaker, desc: '酶促反应速率常数范围验证' },
  { id: 'yield', name: '产物得率一致性', icon: Leaf, desc: '理论得率与文献数据偏差' },
  { id: 'balance', name: '质量/电荷平衡', icon: Star, desc: '元素守恒与电荷中性校验' },
];

export default function ApprovalsCenter() {
  const { user } = useAuthStore();
  const {
    getPendingFirst,
    getPendingSecond,
    approveFirst,
    rejectFirst,
    approveSecond,
    rejectSecond,
  } = useApprovalStore();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('first');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({
    pathway: 85,
    thermo: 78,
    kinetics: 72,
    yield: 80,
    balance: 88,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const pendingFirst = getPendingFirst();
  const pendingSecond = getPendingSecond();

  const currentList = useMemo(() => {
    const list = activeTab === 'first' ? pendingFirst : pendingSecond;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.simulationName.toLowerCase().includes(q) ||
        a.submitterName.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    );
  }, [activeTab, pendingFirst, pendingSecond, searchQuery]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return pendingFirst.concat(pendingSecond).find((a) => a.id === selectedId) || null;
  }, [selectedId, pendingFirst, pendingSecond]);

  if (!selected && currentList.length > 0 && selectedId === null) {
    setTimeout(() => setSelectedId(currentList[0]?.id || null), 0);
  }

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  const handleApprove = () => {
    if (!selected || !user) return;
    if (activeTab === 'first') {
      approveFirst(selected.id, user.id, user.realName, comment);
    } else {
      approveSecond(selected.id, user.id, user.realName, comment);
    }
    setComment('');
    setSelectedId(null);
  };

  const handleReject = () => {
    if (!selected || !user || !comment.trim()) return;
    if (activeTab === 'first') {
      rejectFirst(selected.id, user.id, user.realName, comment);
    } else {
      rejectSecond(selected.id, user.id, user.realName, comment);
    }
    setComment('');
    setSelectedId(null);
  };

  const formatDate = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm');
  const timeAgo = (iso: string) => dayjs(iso).fromNow();

  return (
      <div className="space-y-6 h-[calc(100vh-10rem)]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">审批中心</h1>
            <p className="mt-1 text-forest-600/70">审核模拟任务的参数合理性与科学价值</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-pending">
              <Clock className="w-3.5 h-3.5" />
              待处理 {pendingFirst.length + pendingSecond.length}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 h-full">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 card flex flex-col overflow-hidden"
          >
            <div className="border-b border-forest-600/10 p-4 space-y-4">
              <div className="flex gap-1 p-1 rounded-xl bg-forest-50">
                <button
                  onClick={() => {
                    setActiveTab('first');
                    setSelectedId(pendingFirst[0]?.id || null);
                  }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                    activeTab === 'first'
                      ? 'bg-white text-forest-700 shadow-sm'
                      : 'text-forest-600/60 hover:text-forest-700'
                  )}
                >
                  <CircleDot className="w-4 h-4" />
                  一级验证
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    pendingFirst.length > 0 ? 'bg-status-warning/15 text-status-warning' : 'bg-forest-100 text-forest-600'
                  )}>
                    {pendingFirst.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('second');
                    setSelectedId(pendingSecond[0]?.id || null);
                  }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                    activeTab === 'second'
                      ? 'bg-white text-forest-700 shadow-sm'
                      : 'text-forest-600/60 hover:text-forest-700'
                  )}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  二级专家
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    pendingSecond.length > 0 ? 'bg-forest-500/15 text-forest-600' : 'bg-forest-100 text-forest-600'
                  )}>
                    {pendingSecond.length}
                  </span>
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索任务名称、提交人..."
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {currentList.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-forest-400" />
                    </div>
                    <div className="text-sm font-medium text-forest-700">暂无待审批任务</div>
                    <div className="text-xs text-forest-600/50 mt-1">所有任务均已处理完毕</div>
                  </motion.div>
                ) : (
                  currentList.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      onSelect={() => setSelectedId(item.id)}
                      formatDate={formatDate}
                      timeAgo={timeAgo}
                      activeTab={activeTab}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-3 card flex flex-col overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col h-full"
                >
                  <div className="border-b border-forest-600/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('badge', APPROVAL_STATUS_COLORS[selected.status])}>
                            {APPROVAL_STATUS_LABELS[selected.status]}
                          </span>
                          <span className="font-mono text-xs text-forest-600/50">
                            {selected.simulationId.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="font-display text-xl font-bold text-forest-800">
                          {selected.simulationName}
                        </h2>
                        <p className="mt-2 text-sm text-forest-600/70 line-clamp-2">
                          {selected.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-forest-600/8">
                      <div>
                        <div className="text-xs text-forest-600/50">提交人</div>
                        <div className="mt-0.5 text-sm font-medium text-forest-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-forest-500" />
                          {selected.submitterName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-forest-600/50">土壤类型</div>
                        <div className="mt-0.5 text-sm font-medium text-forest-800">
                          {(selected.simulationParams?.soilType as string) || '通用培养基'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-forest-600/50">提交时间</div>
                        <div className="mt-0.5 text-sm font-medium text-forest-800">
                          {formatDate(selected.submittedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-forest-600/50">等待时长</div>
                        <div className="mt-0.5 text-sm font-medium text-loam-600">
                          {timeAgo(selected.submittedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-forest-600" />
                          <span className="text-sm font-semibold text-forest-800">模拟关键指标预览</span>
                        </div>
                        <button className="text-xs text-forest-600 hover:text-forest-700 flex items-center gap-1">
                          查看完整报告
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '生物量峰值', value: '12.8', unit: 'g/L', color: 'forest' },
                          { label: '底物转化率', value: '87.4', unit: '%', color: 'loam' },
                          { label: '代谢通量', value: '3.6', unit: 'mmol/h', color: 'forest' },
                        ].map((m, i) => (
                          <div
                            key={i}
                            className={cn(
                              'p-4 rounded-xl border',
                              m.color === 'forest'
                                ? 'bg-forest-gradient/5 border-forest-500/15'
                                : 'bg-loam-500/5 border-loam-500/15'
                            )}
                          >
                            <div className="text-xs text-forest-600/60">{m.label}</div>
                            <div className="mt-1.5 flex items-baseline gap-1">
                              <span className={cn(
                                'font-display text-2xl font-bold',
                                m.color === 'forest' ? 'text-forest-700' : 'text-loam-600'
                              )}>
                                {m.value}
                              </span>
                              <span className="text-xs text-forest-600/50">{m.unit}</span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-white/80 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  m.color === 'forest' ? 'bg-forest-gradient' : 'bg-loam-gradient'
                                )}
                                style={{ width: `${(parseFloat(m.value) / ((i === 0 ? 20 : i === 1 ? 100 : 10)))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-forest-600" />
                          <span className="text-sm font-semibold text-forest-800">代谢合理性评估</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-forest-600/60">综合得分</span>
                          <span className={cn(
                            'font-display text-lg font-bold',
                            averageScore >= 80 ? 'text-status-success' :
                            averageScore >= 60 ? 'text-loam-600' : 'text-status-warning'
                          )}>
                            {averageScore.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {metabolicAssessmentItems.map((item) => {
                          const Icon = item.icon;
                          const score = scores[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl border border-forest-600/8 bg-white/60 hover:bg-white transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-9 h-9 rounded-lg bg-forest-gradient/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-4.5 h-4.5 text-forest-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-forest-800">{item.name}</div>
                                    <div className="text-xs text-forest-600/50 mt-0.5">{item.desc}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={score}
                                    onChange={(e) => setScores((s) => ({ ...s, [item.id]: parseInt(e.target.value) }))}
                                    className="w-24 h-1.5 rounded-full bg-forest-100 accent-forest-500 cursor-pointer"
                                  />
                                  <div className={cn(
                                    'font-display font-bold text-lg mt-0.5',
                                    score >= 80 ? 'text-status-success' :
                                    score >= 60 ? 'text-loam-600' : 'text-status-warning'
                                  )}>
                                    {score}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-forest-600" />
                        <span className="text-sm font-semibold text-forest-800">审批意见</span>
                        <span className="text-xs text-forest-600/50">（驳回时必填）</span>
                      </div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="请输入您的审批意见和建议..."
                        rows={4}
                        className="input-field resize-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-forest-600/10 p-4 bg-forest-50/40">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-forest-600/60">
                        <AlertTriangle className="w-3.5 h-3.5 text-loam-600" />
                        <span>平均得分低于 60 分建议驳回修改</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleReject}
                          disabled={!comment.trim()}
                          className="btn-danger"
                        >
                          <XCircle className="w-4 h-4" />
                          驳回修改
                        </button>
                        <button
                          onClick={handleApprove}
                          className="btn-primary"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          通过审批
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-forest-50 flex items-center justify-center mb-5">
                    <Filter className="w-10 h-10 text-forest-400" />
                  </div>
                  <div className="text-lg font-display font-semibold text-forest-800 mb-2">选择左侧任务查看详情</div>
                  <div className="text-sm text-forest-600/50 max-w-xs">
                    点击左侧列表中的审批任务卡片，即可查看详细评估内容并进行审批操作
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
  );
}

function ApprovalCard({
  item,
  isSelected,
  onSelect,
  formatDate,
  timeAgo,
  activeTab,
}: {
  item: ApprovalRecord;
  isSelected: boolean;
  onSelect: () => void;
  formatDate: (iso: string) => string;
  timeAgo: (iso: string) => string;
  activeTab: ApprovalTab;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onSelect}
      className={cn(
        'p-4 rounded-xl border-2 cursor-pointer transition-all group',
        isSelected
          ? 'border-forest-500 bg-forest-gradient/5 shadow-card'
          : 'border-transparent bg-white hover:border-forest-600/15 hover:shadow-card'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          activeTab === 'first' ? 'bg-loam-500/10' : 'bg-forest-500/10'
        )}>
          {activeTab === 'first' ? (
            <CircleDot className="w-5 h-5 text-loam-600" />
          ) : (
            <ClipboardCheck className="w-5 h-5 text-forest-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-forest-800 line-clamp-2 group-hover:text-forest-700">
              {item.simulationName}
            </h3>
            <X className="w-3.5 h-3.5 text-forest-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forest-50 text-forest-700">
              {(item.simulationParams?.strainType as string) || '通用菌株'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-loam-500/10 text-loam-700">
              温度 {(item.simulationParams?.temperature as number) || 37}℃
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-forest-600/60">
              <User className="w-3 h-3" />
              <span>{item.submitterName}</span>
            </div>
            <div className="flex items-center gap-1 text-loam-600">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(item.submittedAt)}</span>
            </div>
          </div>
          <div className="mt-0.5 text-[10px] text-forest-600/40">
            {formatDate(item.submittedAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
