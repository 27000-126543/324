import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Share2, Printer, BarChart3, Leaf, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportPreview() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/simulations"
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-forest-600 hover:border-forest-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
              模拟报告预览
            </h1>
            <p className="text-sm text-slate-500 mt-1">报告 ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-forest-200 hover:text-forest-600 transition-all">
            <Printer className="w-4 h-4" />
            打印
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-forest-200 hover:text-forest-600 transition-all">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-gradient text-white text-sm font-medium hover:shadow-lg hover:shadow-forest-500/20 transition-all">
            <Download className="w-4 h-4" />
            导出 PDF
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="bg-forest-gradient-soft border-b border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-forest-gradient flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">
                    土壤微生物碳循环模拟报告
                  </h2>
                  <p className="text-sm text-slate-500">生成时间：2024-06-09 12:30:00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: BarChart3, label: '总 CO₂ 释放', value: '1,284.5 mg/kg', sub: '90天累计' },
              { icon: Leaf, label: '最终碳储量', value: '23.8 g/kg', sub: '+12.4% 基线' },
              { icon: TrendingUp, label: '固碳潜力', value: '892 kg/ha', sub: '年度估算' },
              { icon: AlertTriangle, label: '预警事件', value: '3 次', sub: '2 次已处理' },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </div>
                <p className="text-lg font-display font-bold text-slate-800 dark:text-white">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-forest-50 dark:bg-forest-500/10 flex items-center justify-center">
              <FileText className="w-10 h-10 text-forest-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-white mb-2">
              报告详情内容
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              完整报告包含碳分解曲线、微生物群落组成、酶活性热图、碳库趋势图等可视化图表，
              以及调整日志和审批记录附录。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
