import React, { useEffect, useRef, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'flat';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  start?: number;
  easing?: string | ((t: number) => number);
}

const easingFunctions: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeOutQuad: (t) => t * (2 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  start = 0,
  easing = 'easeOutExpo',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(start);
  const previousValue = useRef(start);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    const easingFn = typeof easing === 'function' ? easing : easingFunctions[easing];

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = from + (to - from) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = to;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, easing]);

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString('zh-CN');

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

interface TrendProps {
  value: number;
  suffix?: string;
  decimals?: number;
  showIcon?: boolean;
  className?: string;
}

export function Trend({ value, suffix = '%', decimals = 1, showIcon = true, className }: TrendProps) {
  const direction: TrendDirection = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const ArrowIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
        direction === 'down' && 'text-red-600 dark:text-red-400',
        direction === 'flat' && 'text-slate-500 dark:text-slate-400',
        className
      )}
    >
      {showIcon && <TrendIcon className="w-3.5 h-3.5" />}
      <ArrowIcon className="w-3 h-3" />
      <AnimatedNumber
        value={Math.abs(value)}
        decimals={decimals}
        suffix={suffix}
        duration={800}
        easing="easeOutQuad"
      />
    </span>
  );
}

type DataCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type DataCardSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<DataCardVariant, { gradient: string; iconBg: string; accent: string; glow: string }> = {
  default: {
    gradient: 'from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    accent: 'text-slate-800 dark:text-white',
    glow: '',
  },
  primary: {
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    accent: 'text-emerald-700 dark:text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  success: {
    gradient: 'from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/5',
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    accent: 'text-green-700 dark:text-green-400',
    glow: 'shadow-green-500/10',
  },
  warning: {
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    accent: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  danger: {
    gradient: 'from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/5',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    accent: 'text-red-700 dark:text-red-400',
    glow: 'shadow-red-500/10',
  },
  info: {
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/5',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    accent: 'text-blue-700 dark:text-blue-400',
    glow: 'shadow-blue-500/10',
  },
};

const sizeStyles: Record<DataCardSize, { padding: string; title: string; value: string; icon: string }> = {
  sm: {
    padding: 'p-4',
    title: 'text-xs',
    value: 'text-2xl',
    icon: 'w-8 h-8',
  },
  md: {
    padding: 'p-5',
    title: 'text-sm',
    value: 'text-3xl',
    icon: 'w-10 h-10',
  },
  lg: {
    padding: 'p-6',
    title: 'text-sm',
    value: 'text-4xl',
    icon: 'w-12 h-12',
  },
};

interface DataCardProps {
  title: string;
  value: number;
  icon?: React.ElementType;
  variant?: DataCardVariant;
  size?: DataCardSize;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: number;
  trendLabel?: string;
  description?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
  animationDuration?: number;
}

export function DataCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  size = 'md',
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  trendLabel = '较上周',
  description,
  footer,
  onClick,
  loading = false,
  className,
  valueClassName,
  animationDuration = 1500,
}: DataCardProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const isClickable = !!onClick;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'relative rounded-2xl bg-gradient-to-br border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300',
        styles.gradient,
        styles.glow,
        sizes.padding,
        isClickable && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300/70 dark:hover:border-slate-600/70 active:scale-[0.98]',
        loading && 'opacity-60 pointer-events-none',
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent dark:from-slate-700/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-slate-500 dark:text-slate-400 mb-1', sizes.title)}>
            {title}
          </p>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300',
              styles.iconBg,
              sizes.icon,
              isClickable && 'group-hover:scale-110'
            )}
          >
            <Icon className={cn('w-1/2 h-1/2', variant === 'primary' && 'text-emerald-600 dark:text-emerald-400')} />
          </div>
        )}
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse w-3/4" />
        ) : (
          <div className="flex items-baseline gap-1 flex-wrap">
            <AnimatedNumber
              value={value}
              decimals={decimals}
              prefix={prefix}
              suffix={suffix}
              duration={animationDuration}
              className={cn(
                'font-bold tracking-tight',
                styles.accent,
                sizes.value,
                valueClassName
              )}
            />
          </div>
        )}
      </div>

      {(trend !== undefined || footer) && (
        <div className="relative mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2">
          {trend !== undefined && !loading && (
            <div className="flex items-center gap-2">
              <Trend value={trend} decimals={decimals > 0 ? 1 : 0} />
              <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel}</span>
            </div>
          )}
          {trend === undefined && !footer && <div />}
          {footer}
        </div>
      )}
    </div>
  );
}

interface DataCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DataCardGrid({ children, columns = 4, className }: DataCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default DataCard;
