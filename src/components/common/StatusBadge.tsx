import React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  XCircle,
  StopCircle,
  FileCheck2,
  Info,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SimulationStatus,
  SIMULATION_STATUS_LABELS,
  SIMULATION_STATUS_COLORS,
  SIMULATION_STATUS_DOT_COLORS,
} from '@/stores/simulationStore';
import {
  WarningLevel,
  WARNING_LEVEL_LABELS,
  WARNING_LEVEL_COLORS,
  WARNING_LEVEL_DOT_COLORS,
} from '@/stores/warningStore';

type BadgeSize = 'sm' | 'md' | 'lg';

const SIMULATION_STATUS_ICONS: Record<SimulationStatus, React.ElementType> = {
  draft: FileCheck2,
  pending_approval: Clock,
  approved: CheckCircle2,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: StopCircle,
};

const WARNING_LEVEL_ICONS: Record<WarningLevel, React.ElementType> = {
  info: Info,
  low: Minus,
  medium: AlertTriangle,
  high: Flame,
  critical: AlertOctagon,
};

interface BaseBadgeProps {
  size?: BadgeSize;
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
}

interface StatusBadgeProps extends BaseBadgeProps {
  status: SimulationStatus;
  label?: string;
}

const sizeClasses: Record<BadgeSize, { badge: string; icon: string; dot: string }> = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-2.5 py-1 text-xs gap-1.5',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
  },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = false,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const Icon = SIMULATION_STATUS_ICONS[status];
  const isRunning = status === 'running';
  const sizes = sizeClasses[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        SIMULATION_STATUS_COLORS[status],
        sizes.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            SIMULATION_STATUS_DOT_COLORS[status],
            sizes.dot,
            isRunning && 'animate-pulse'
          )}
        />
      )}
      {showIcon && (
        <Icon
          className={cn(
            sizes.icon,
            'shrink-0',
            isRunning && 'animate-spin'
          )}
        />
      )}
      <span>{label ?? SIMULATION_STATUS_LABELS[status]}</span>
    </span>
  );
}

interface WarningBadgeProps extends BaseBadgeProps {
  level: WarningLevel;
  label?: string;
}

export function WarningBadge({
  level,
  label,
  size = 'md',
  showIcon = true,
  showDot = false,
  className,
}: WarningBadgeProps) {
  const Icon = WARNING_LEVEL_ICONS[level];
  const sizes = sizeClasses[size];
  const isPulsing = level === 'critical' || level === 'high';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        WARNING_LEVEL_COLORS[level],
        sizes.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            WARNING_LEVEL_DOT_COLORS[level],
            sizes.dot,
            isPulsing && 'animate-pulse'
          )}
        />
      )}
      {showIcon && (
        <Icon
          className={cn(
            sizes.icon,
            'shrink-0',
            isPulsing && 'animate-pulse'
          )}
        />
      )}
      <span>{label ?? WARNING_LEVEL_LABELS[level]}</span>
    </span>
  );
}

interface StatusDotProps {
  status: SimulationStatus;
  size?: BadgeSize;
  className?: string;
  label?: boolean;
}

export function StatusDot({ status, size = 'md', className, label = false }: StatusDotProps) {
  const sizes = sizeClasses[size];
  const isRunning = status === 'running';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-full shrink-0',
          SIMULATION_STATUS_DOT_COLORS[status],
          sizes.dot,
          isRunning && 'animate-pulse',
          className
        )}
      />
      {label && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {SIMULATION_STATUS_LABELS[status]}
        </span>
      )}
    </span>
  );
}

interface ProgressBadgeProps {
  progress: number;
  status?: SimulationStatus;
  size?: BadgeSize;
  className?: string;
}

export function ProgressBadge({
  progress,
  status,
  size = 'md',
  className,
}: ProgressBadgeProps) {
  const isRunning = status === 'running';
  const sizes = sizeClasses[size];

  let colorClass = SIMULATION_STATUS_COLORS.draft;
  if (status) {
    colorClass = SIMULATION_STATUS_COLORS[status];
  } else if (progress >= 100) {
    colorClass = SIMULATION_STATUS_COLORS.completed;
  } else if (progress > 0) {
    colorClass = SIMULATION_STATUS_COLORS.running;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        colorClass,
        sizes.badge,
        className
      )}
    >
      {isRunning && (
        <Loader2 className={cn(sizes.icon, 'animate-spin shrink-0')} />
      )}
      <span className="tabular-nums">{progress}%</span>
    </span>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
  size?: BadgeSize;
  className?: string;
}

const PRIORITY_LABELS = { low: '低优先级', medium: '中优先级', high: '高优先级' };
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

export function PriorityBadge({ priority, size = 'md', className }: PriorityBadgeProps) {
  const sizes = sizeClasses[size];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        PRIORITY_COLORS[priority],
        sizes.badge,
        className
      )}
    >
      <Circle
        className={cn(
          sizes.icon,
          'shrink-0 fill-current',
          priority === 'low' && 'text-gray-400',
          priority === 'medium' && 'text-orange-400',
          priority === 'high' && 'text-red-400'
        )}
      />
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}

export default StatusBadge;
