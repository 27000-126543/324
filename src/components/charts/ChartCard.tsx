import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  MoreHorizontal,
  Download,
  RefreshCw,
  Maximize2,
  Settings,
  RefreshCcw,
  FileImage,
  FileSpreadsheet,
  Share2,
  ZoomIn,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';

type TimeRangeKey = '1h' | '7d' | '30d' | '90d' | 'all';

const TIME_RANGES: { key: TimeRangeKey; label: string }[] = [
  { key: '1h', label: '近1小时' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
  { key: 'all', label: '全部' },
];

const BASE_CHART_STYLE = {
  height: '100%',
  width: '100%',
};

const lightChartTheme = (isDark: boolean) => ({
  backgroundColor: 'transparent',
  textStyle: {
    color: isDark ? '#94a3b8' : '#64748b',
  },
  title: {
    textStyle: { color: isDark ? '#f1f5f9' : '#1e293b' },
  },
});

interface ChartCardProps {
  title: string;
  option: EChartsOption;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  chartClassName?: string;
  height?: number | string;
  actions?: React.ReactNode;
  showTimeRange?: boolean;
  defaultTimeRange?: TimeRangeKey;
  onTimeRangeChange?: (range: TimeRangeKey) => void;
  showRefresh?: boolean;
  onRefresh?: () => void;
  showDownload?: boolean;
  downloadFormats?: ('png' | 'jpg' | 'svg' | 'excel' | 'csv')[];
  showFullscreen?: boolean;
  showSettings?: boolean;
  footer?: React.ReactNode;
  footerAlign?: 'left' | 'right' | 'center';
  bordered?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  optionOverride?: (option: EChartsOption, isDark: boolean) => EChartsOption;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  onChartReady?: (instance: unknown) => void;
  onEvents?: Record<string, (params: unknown) => void>;
  headerExtra?: React.ReactNode;
  description?: string;
  icon?: React.ElementType;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  none: 'p-0',
};

const variantGlow = {
  default: '',
  primary: 'shadow-emerald-500/5',
  success: 'shadow-green-500/5',
  warning: 'shadow-amber-500/5',
  danger: 'shadow-red-500/5',
};

const variantAccent = {
  default: '',
  primary: 'before:bg-emerald-500',
  success: 'before:bg-green-500',
  warning: 'before:bg-amber-500',
  danger: 'before:bg-red-500',
};

export function ChartCard({
  title,
  option,
  subtitle,
  loading = false,
  className,
  chartClassName,
  height = 320,
  actions,
  showTimeRange = false,
  defaultTimeRange = '7d',
  onTimeRangeChange,
  showRefresh = true,
  onRefresh,
  showDownload = false,
  downloadFormats = ['png'],
  showFullscreen = false,
  showSettings = false,
  footer,
  footerAlign = 'left',
  bordered = true,
  padding = 'md',
  optionOverride,
  notMerge = false,
  lazyUpdate = false,
  onChartReady,
  onEvents,
  headerExtra,
  description,
  icon: Icon,
  variant = 'default',
}: ChartCardProps) {
  const chartRef = useRef<ReactECharts | null>(null);
  const { effectiveTheme, showSuccess, showError } = useUiStore();
  const isDark = effectiveTheme === 'dark';
  const [timeRange, setTimeRange] = useState<TimeRangeKey>(defaultTimeRange);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const mergedOption: EChartsOption = useMemo(() => {
    const baseTheme = lightChartTheme(isDark);
    let merged: EChartsOption = {
      ...baseTheme,
      ...option,
    };
    if (optionOverride) {
      merged = optionOverride(merged, isDark);
    }
    return merged;
  }, [option, isDark, optionOverride]);

  const handleTimeRangeChange = (range: TimeRangeKey) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
      await onRefresh();
    } else {
      chartRef.current?.getEchartsInstance().dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100,
      });
    }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleFullscreen = async () => {
    if (!fullscreenRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      showError('全屏操作失败，请使用浏览器缩放代替');
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleDownload = (format: 'png' | 'jpg' | 'svg' | 'excel' | 'csv') => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    try {
      if (format === 'png' || format === 'jpg' || format === 'svg') {
        const url = chart.getDataURL({
          type: format === 'jpg' ? 'jpeg' : format,
          pixelRatio: 2,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        });
        const link = document.createElement('a');
        link.download = `${title}-${Date.now()}.${format === 'jpg' ? 'jpg' : format}`;
        link.href = url;
        link.click();
        showSuccess(`图表已导出为 ${format.toUpperCase()}`);
      } else {
      }
    } catch (e) {
      showError('导出失败，请稍后重试');
    }
    setMenuOpen(false);
  };

  const onHideMenu = () => setMenuOpen(false);

  return (
    <>
      <div
        ref={fullscreenRef}
        className={cn(
          'relative rounded-2xl bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300',
          bordered && 'border border-slate-200 dark:border-slate-700',
          variantGlow[variant],
          variant !== 'default' && 'shadow-lg',
          paddingMap[padding],
          className
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-0 w-1 h-full opacity-8 rounded-l-2xl',
            variantAccent[variant]
          )}
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                variant === 'default' && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                variant === 'primary' && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                variant === 'success' && 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
                variant === 'warning' && 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
                variant === 'danger' && 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white truncate">
                {title}
              </h3>
              {headerExtra}
            </div>
            {(subtitle || description) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          {showTimeRange && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleTimeRangeChange(range.key)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                    timeRange === range.key
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}

          {actions}

          <div className="flex items-center gap-1">
            {showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50"
                title="刷新图表"
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              </button>
            )}

            {(showDownload || showFullscreen || showSettings) && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                  title="更多操作"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={onHideMenu} />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      {showDownload && (
                        <>
                          <div className="px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            导出图表
                          </div>
                          {downloadFormats.includes('png') && (
                            <button
                              onClick={() => handleDownload('png')}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <FileImage className="w-4 h-4" />
                              导出为 PNG
                            </button>
                          )}
                          {downloadFormats.includes('jpg') && (
                            <button
                              onClick={() => handleDownload('jpg')}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <FileImage className="w-4 h-4" />
                              导出为 JPG
                            </button>
                          )}
                          {downloadFormats.includes('svg') && (
                            <button
                              onClick={() => handleDownload('svg')}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <ZoomIn className="w-4 h-4" />
                              导出为 SVG
                            </button>
                          )}
                          {downloadFormats.includes('excel') && (
                            <button
                              onClick={() => handleDownload('excel')}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              导出为 Excel
                            </button>
                          )}
                        </>
                      )}

                      {showFullscreen && (
                        <>
                          {(showDownload && showFullscreen) && (
                            <div className="border-t border-slate-100 dark:border-slate-700" />
                          )}
                          <button
                            onClick={() => {
                              handleFullscreen();
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            {isFullscreen ? (
                              <>
                                <X className="w-4 h-4" />
                                退出全屏
                              </>
                            ) : (
                              <>
                                <Maximize2 className="w-4 h-4" />
                                全屏显示
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {showSettings && (
                        <>
                          {(showDownload || showFullscreen) && (
                            <div className="border-t border-slate-100 dark:border-slate-700" />
                          )}
                          <button
                            onClick={() => setMenuOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            图表设置
                          </button>
                        </>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => {
                            chartRef.current?.getEchartsInstance().dispatchAction({
                              type: 'dataZoom',
                              start: 0,
                              end: 100,
                            });
                            setMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          重置缩放
                        </button>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          分享图表
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        <div
          className={cn('relative', chartClassName)}
          style={{ height }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">数据加载中...</span>
              </div>
            </div>
          )}

          <ReactECharts
            ref={chartRef}
            option={mergedOption}
            style={BASE_CHART_STYLE}
            notMerge={notMerge}
            lazyUpdate={lazyUpdate}
            onChartReady={(instance) => {
              onChartReady?.(instance);
            }}
            onEvents={onEvents as unknown as Record<string, (params: unknown) => void>}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        {footer && (
          <div
            className={cn(
              'mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs',
              footerAlign === 'left' && 'text-left',
              footerAlign === 'right' && 'text-right',
              footerAlign === 'center' && 'text-center',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

interface ChartGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ChartGrid({ children, columns = 2, className }: ChartGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 lg:grid-cols-2',
        columns === 3 && 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
}

export default ChartCard;
