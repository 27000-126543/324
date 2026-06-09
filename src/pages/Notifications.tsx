import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  ClipboardCheck,
  Megaphone,
  CheckCheck,
  Trash2,
  Filter,
  Check,
  X,
  User,
  ChevronRight,
  Search,
  Clock,
  Square,
  CheckSquare,
  Info,
  FileCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { cn } from '@/lib/utils';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
import {
  useWarningStore,
  WARNING_LEVEL_LABELS,
  WARNING_LEVEL_COLORS,
  WARNING_LEVEL_DOT_COLORS,
  WARNING_STATUS_LABELS,
  WarningEvent,
} from '@/stores/warningStore';
import {
  useApprovalStore,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/stores/approvalStore';

type NotificationCategory = 'all' | 'warning' | 'approval' | 'system';
type ReadFilter = 'all' | 'unread' | 'read';

interface CombinedNotification {
  id: string;
  type: 'warning' | 'approval' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  level?: string;
  meta?: Record<string, unknown>;
}

const systemNotifications = [
  {
    id: 'sys-001',
    type: 'system' as const,
    title: '系统版本更新 v2.4.1 发布',
    message: '新增固碳推荐引擎、优化审批流程、修复 pH 突变检测逻辑，请查看更新日志。',
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    read: false,
  },
  {
    id: 'sys-002',
    type: 'system' as const,
    title: '每周数据备份完成通知',
    message: '本周全量数据备份已完成，共 2.4TB 数据，校验通过。备份文件存储于节点 B2。',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    read: true,
  },
  {
    id: 'sys-003',
    type: 'system' as const,
    title: '计算资源调度规则调整',
    message: '工作日 09:00-18:00 期间高优先级任务 CPU 配额提升至 75%，夜间恢复为 50%。',
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    read: true,
  },
];

function WarningBadge({ level }: { level: string }) {
  return (
    <span className="relative flex h-3 w-3">
      {level === 'critical' || level === 'high' ? (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-critical opacity-75" />
      ) : null}
      <span className={cn('relative inline-flex rounded-full h-3 w-3', WARNING_LEVEL_DOT_COLORS[level as keyof typeof WARNING_LEVEL_DOT_COLORS])} />
    </span>
  );
}

export default function Notifications() {
  const { warnings, deleteWarning, batchAcknowledge, clearResolved } = useWarningStore();
  const { approvals } = useApprovalStore();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const allNotifications: CombinedNotification[] = useMemo(() => {
    const list: CombinedNotification[] = [];

    warnings.forEach((w) => {
      list.push({
        id: `w-${w.id}`,
        type: 'warning',
        title: w.title,
        message: w.message,
        createdAt: w.triggeredAt,
        read: w.status !== 'pending',
        level: w.level,
        meta: { warning: w },
      });
    });

    approvals.forEach((a) => {
      const isApproved = a.status === 'approved_second';
      const isRejected = a.status === 'rejected_first' || a.status === 'rejected_second';
      if (isApproved || isRejected) {
        list.push({
          id: `a-${a.id}`,
          type: 'approval',
          title: `审批${isApproved ? '通过' : '驳回'}：${a.simulationName}`,
          message: isApproved
            ? `由 ${a.secondApproverName || a.firstApproverName} 终审通过，可执行模拟。`
            : `由 ${a.secondApproverName || a.firstApproverName} 驳回：${(isRejected ? a.secondComment || a.firstComment : '') || '请查看详情'}`,
          createdAt: (a.secondApprovedAt || a.secondRejectedAt || a.firstApprovedAt || a.firstRejectedAt)!,
          read: false,
          meta: {
            approval: a,
            approver: a.secondApproverName || a.firstApproverName || '',
          },
        });
      }
    });

    systemNotifications.forEach((s) => list.push(s as CombinedNotification));

    return list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  }, [warnings, approvals]);

  const filtered = useMemo(() => {
    let result = allNotifications;
    if (activeCategory !== 'all') result = result.filter((n) => n.type === activeCategory);
    if (readFilter === 'unread') result = result.filter((n) => !n.read);
    if (readFilter === 'read') result = result.filter((n) => n.read);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allNotifications, activeCategory, readFilter, searchQuery]);

  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const warningCount = allNotifications.filter((n) => n.type === 'warning' && !n.read).length;
  const approvalCount = allNotifications.filter((n) => n.type === 'approval' && !n.read).length;
  const systemCount = allNotifications.filter((n) => n.type === 'system' && !n.read).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    }
  };

  const handleDelete = (id: string) => {
    const realId = id.replace(/^[wa]-/, '');
    if (id.startsWith('w-')) deleteWarning(realId);
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => {
      const realId = id.replace(/^[wa]-/, '');
      if (id.startsWith('w-')) deleteWarning(realId);
    });
    setSelectedIds(new Set());
  };

  const handleMarkAllRead = () => {
    // 简化处理：在真实场景会更新 read 状态
    clearResolved();
  };

  const formatTime = (iso: string) => dayjs(iso).fromNow();
  const formatFullTime = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm');

  const categoryTabs: Array<{ key: NotificationCategory; label: string; icon: React.ElementType; count: number }> = [
    { key: 'all', label: '全部', icon: Bell, count: unreadCount },
    { key: 'warning', label: '预警', icon: AlertTriangle, count: warningCount },
    { key: 'approval', label: '审批', icon: ClipboardCheck, count: approvalCount },
    { key: 'system', label: '系统公告', icon: Megaphone, count: systemCount },
  ];

  return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">通知中心</h1>
            <p className="mt-1 text-forest-600/70">
              {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '所有通知均已处理完毕'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-info">
              <Bell className="w-3.5 h-3.5" />
              共 {allNotifications.length} 条
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card overflow-hidden"
        >
          <div className="border-b border-forest-600/10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              <div className="flex gap-1 p-1 rounded-xl bg-forest-50 flex-wrap">
                {categoryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveCategory(tab.key)}
                      className={cn(
                        'relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                        isActive
                          ? 'bg-white text-forest-700 shadow-sm'
                          : 'text-forest-600/60 hover:text-forest-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={cn(
                          'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                          isActive
                            ? 'bg-status-critical text-white'
                            : 'bg-forest-200 text-forest-700'
                        )}>
                          {tab.count > 99 ? '99+' : tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 flex items-center gap-3 sm:justify-end flex-wrap">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-600/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索通知内容..."
                    className="input-field pl-9 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-forest-50">
                  {(['all', 'unread', 'read'] as ReadFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setReadFilter(f)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        readFilter === f
                          ? 'bg-white text-forest-700 shadow-sm'
                          : 'text-forest-600/60 hover:text-forest-700'
                      )}
                    >
                      {f === 'all' ? '全部' : f === 'unread' ? '未读' : '已读'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-forest-50/50 border-t border-forest-600/8">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-forest-700 hover:text-forest-800"
                >
                  {selectedIds.size === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-forest-600" />
                  ) : (
                    <Square className="w-4 h-4 text-forest-400" />
                  )}
                  <span className="font-medium">全选</span>
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-forest-600/70">
                    已选择 {selectedIds.size} 项
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="btn-danger !px-3 !py-1.5 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除选中
                  </button>
                )}
                <button
                  onClick={handleMarkAllRead}
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  全部标为已读
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-forest-600/8 max-h-[calc(100vh-420px)] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-forest-50 flex items-center justify-center mb-5">
                    <Bell className="w-10 h-10 text-forest-400" />
                  </div>
                  <div className="text-lg font-display font-semibold text-forest-800 mb-2">暂无通知</div>
                  <div className="text-sm text-forest-600/50">当前筛选条件下没有匹配的通知</div>
                </motion.div>
              ) : (
                filtered.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    isSelected={selectedIds.has(n.id)}
                    onToggleSelect={() => toggleSelect(n.id)}
                    onDelete={() => handleDelete(n.id)}
                    formatTime={formatTime}
                    formatFullTime={formatFullTime}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
  );
}

function NotificationItem({
  notification,
  isSelected,
  onToggleSelect,
  onDelete,
  formatTime,
  formatFullTime,
}: {
  notification: CombinedNotification;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  formatTime: (iso: string) => string;
  formatFullTime: (iso: string) => string;
}) {
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-status-critical/10',
      iconColor: 'text-status-critical',
    },
    approval: {
      icon: ClipboardCheck,
      iconBg: 'bg-forest-500/10',
      iconColor: 'text-forest-600',
    },
    system: {
      icon: Megaphone,
      iconBg: 'bg-status-info/10',
      iconColor: 'text-status-info',
    },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;
  const warning = notification.meta?.warning as WarningEvent | undefined;
  const approver = (notification.meta?.approver as string) || '';
  const approval = notification.meta?.approval;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, height: 0 }}
      className={cn(
        'group relative transition-colors',
        !notification.read && 'bg-forest-gradient/[0.03]',
        isSelected && 'bg-forest-500/5'
      )}
    >
      <div className="flex items-start gap-4 p-5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="mt-1 shrink-0"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-forest-600" />
          ) : (
            <Square className="w-4 h-4 text-forest-300 group-hover:text-forest-500 transition-colors" />
          )}
        </button>

        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative',
          config.iconBg
        )}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
          {notification.type === 'warning' && notification.level && (
            <div className="absolute -top-1 -right-1">
              <WarningBadge level={notification.level} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-status-info shrink-0" />
                )}
                <h3 className={cn(
                  'text-sm font-semibold truncate',
                  notification.read ? 'text-forest-700' : 'text-forest-800'
                )}>
                  {notification.title}
                </h3>
                {notification.type === 'warning' && notification.level && (
                  <span className={cn(
                    'badge text-[10px]',
                    WARNING_LEVEL_COLORS[notification.level as keyof typeof WARNING_LEVEL_COLORS]
                  )}>
                    {WARNING_LEVEL_LABELS[notification.level as keyof typeof WARNING_LEVEL_LABELS]}
                  </span>
                )}
                {notification.type === 'approval' && (
                  <span className={cn(
                    'badge text-[10px]',
                    approval
                      ? APPROVAL_STATUS_COLORS[(approval as { status: string }).status as keyof typeof APPROVAL_STATUS_COLORS]
                      : 'bg-forest-100 text-forest-700'
                  )}>
                    {approval
                      ? APPROVAL_STATUS_LABELS[(approval as { status: keyof typeof APPROVAL_STATUS_LABELS }).status]
                      : '审批结果'}
                  </span>
                )}
                {notification.type === 'system' && (
                  <span className="badge-info text-[10px]">
                    <Info className="w-3 h-3" />
                    公告
                  </span>
                )}
              </div>

              <p className={cn(
                'mt-1.5 text-sm leading-relaxed',
                notification.read ? 'text-forest-600/70' : 'text-forest-600'
              )}>
                {notification.message}
              </p>

              <div className="mt-2.5 flex items-center gap-4 text-xs text-forest-600/50 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(notification.createdAt)}</span>
                  <span className="text-forest-600/30">·</span>
                  <span>{formatFullTime(notification.createdAt)}</span>
                </div>
                {notification.type === 'approval' && approver && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>审批人：{approver}</span>
                  </div>
                )}
                {notification.type === 'warning' && warning?.relatedSimulationName && (
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{warning.relatedSimulationName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {notification.type !== 'system' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-forest-500 hover:bg-forest-50 hover:text-forest-700 transition-colors"
                  title="查看详情"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-forest-400 hover:bg-status-critical/10 hover:text-status-critical transition-colors"
                title="删除通知"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-forest-500" />
      )}
    </motion.div>
  );
}
