import { useState, useCallback, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  FlaskConical,
  ThermometerSun,
  Droplets,
  Leaf,
  Database,
  FileCode,
  AlertCircle,
  CheckCircle2,
  X,
  CloudUpload,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  GripVertical,
  Zap,
  Info,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { cn } from '@/lib/utils';

const soilTypes = [
  { value: 'black', label: '黑土', region: '东北平原' },
  { value: 'red', label: '红壤', region: '长江以南' },
  { value: 'yellow', label: '黄壤', region: '云贵高原' },
  { value: 'brown', label: '棕壤', region: '华北地区' },
  { value: 'chestnut', label: '栗钙土', region: '内蒙古高原' },
  { value: 'desert', label: '荒漠土', region: '西北内陆' },
  { value: 'meadow', label: '草甸土', region: '三江平原' },
  { value: 'paddy', label: '水稻土', region: '长江中下游' },
  { value: 'loess', label: '黄绵土', region: '黄土高原' },
  { value: 'brick', label: '砖红壤', region: '海南岛' },
];

const rowSchema = z.object({
  sampleId: z.string().min(1, '样本编号必填').regex(/^[A-Z]-?\d{3}$/i, '格式如 A-001'),
  ph: z.coerce.number().min(0, 'pH≥0').max(14, 'pH≤14'),
  organicMatter: z.coerce.number().min(0, '≥0 g/kg').max(500, '≤500 g/kg'),
  temperature: z.coerce.number().min(-40, '≥-40℃').max(80, '≤80℃'),
  moisture: z.coerce.number().min(0, '≥0%').max(100, '≤100%'),
  soilType: z.string().min(1, '请选择土壤类型'),
  notes: z.string().optional(),
});

const formSchema = z.object({
  rows: z.array(rowSchema).min(1, '至少添加1行数据'),
});

type FormData = z.infer<typeof formSchema>;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

export default function DataUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([
    { id: '1', name: 'metagenome_rhizosphere_A.fastq.gz', size: 284739201, type: 'FASTQ', progress: 100, status: 'done' },
    { id: '2', name: '16S_amplicon_soil_B.fastq', size: 92847163, type: 'FASTQ', progress: 68, status: 'uploading' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultRows: FormData['rows'] = [
    { sampleId: 'A-001', ph: 6.8, organicMatter: 32.4, temperature: 18.5, moisture: 34.2, soilType: 'black', notes: '0-20cm 耕层' },
    { sampleId: 'A-002', ph: 5.4, organicMatter: 18.7, temperature: 22.1, moisture: 28.9, soilType: 'red', notes: '' },
    { sampleId: '', ph: NaN, organicMatter: NaN, temperature: NaN, moisture: NaN, soilType: '', notes: '' },
  ];

  const { control, handleSubmit, watch, setValue, setError, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { rows: defaultRows },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });
  const watchRows = watch('rows');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const simulateUpload = useCallback((newFiles: File[]) => {
    newFiles.forEach((f, idx) => {
      const id = Date.now().toString() + idx;
      const file: UploadedFile = {
        id,
        name: f.name,
        size: f.size,
        type: f.name.endsWith('.gz') ? 'FASTQ.GZ' : f.name.includes('fastq') ? 'FASTQ' : f.name.split('.').pop()?.toUpperCase() || 'FILE',
        progress: 0,
        status: 'uploading',
      };
      setFiles((prev) => [...prev, file]);
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  progress: Math.min(100, p.progress + Math.random() * 18 + 6),
                  status: p.progress + 20 >= 100 ? 'done' : 'uploading',
                }
              : p
          )
        );
      }, 350 + idx * 100);
      setTimeout(() => clearInterval(interval), 4000);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload(Array.from(e.dataTransfer.files));
    }
  }, [simulateUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const onSubmit = (data: FormData) => {
    console.log('提交数据:', data, files);
    alert(`已提交 ${data.rows.length} 条理化数据，${files.filter(f => f.status === 'done').length} 个宏基因组文件`);
  };

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const totalFileSize = files.reduce((s, f) => s + f.size, 0);
  const doneFiles = files.filter(f => f.status === 'done').length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
              数据上传中心
            </h1>
            <p className="mt-1 text-forest-600/70">
              录入土壤理化性质参数 · 上传宏基因组测序原始数据
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-gradient/8 border border-forest-600/12">
              <Sparkles className="w-4 h-4 text-forest-600" />
              <span className="text-sm text-forest-700">AI 辅助缺失值填补已启用</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm"
            >
              <FolderOpen className="w-4 h-4" />
              本地文件
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '已录入样本', value: fields.length.toString(), icon: FlaskConical, color: 'text-forest-600', bg: 'bg-forest-gradient/10' },
            { label: '上传文件数', value: `${doneFiles}/${files.length}`, icon: FileCode, color: 'text-loam-600', bg: 'bg-loam-gradient/10' },
            { label: '总数据量', value: formatSize(totalFileSize), icon: Database, color: 'text-status-info', bg: 'bg-status-info/10' },
            { label: '土壤类型覆盖', value: `${new Set(watchRows.filter(r => r.soilType).map(r => r.soilType)).size}类`, icon: Layers, color: 'text-status-success', bg: 'bg-status-success/10' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="card p-5 flex items-center gap-4"
              >
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-5 h-5', s.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-forest-600/60 font-medium">{s.label}</div>
                  <div className="mt-0.5 font-display text-xl font-bold text-forest-800 tracking-tight truncate">{s.value}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="card overflow-hidden">
            <div className="card-header cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-gradient/10 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-forest-600" />
                </div>
                <div>
                  <div className="section-title">理化数据网格录入</div>
                  <div className="section-subtitle">pH · 有机质含量 · 温湿度 · 土壤类型 · 支持批量导入</div>
                </div>
                {errors.rows && (
                  <span className="badge-critical ml-4">
                    <AlertCircle className="w-3.5 h-3.5" />
                    数据校验失败
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-ghost text-sm py-1.5">
                  <FileText className="w-4 h-4" />
                  导入Excel
                </button>
                {expanded ? <ChevronUp className="w-5 h-5 text-forest-600/60" /> : <ChevronDown className="w-5 h-5 text-forest-600/60" />}
              </div>
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-forest-gradient/5 border-b border-forest-600/12">
                          <th className="w-10 px-3 py-3"></th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            <div className="flex items-center gap-1.5"><GripVertical className="w-3 h-3 opacity-50" />样本编号</div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-loam-500" />pH值</div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            <div className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-status-success" />有机质 (g/kg)</div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            <div className="flex items-center gap-1.5"><ThermometerSun className="w-3 h-3 text-status-warning" />温度 (℃)</div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            <div className="flex items-center gap-1.5"><Droplets className="w-3 h-3 text-status-info" />湿度 (%)</div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">
                            土壤类型
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-forest-700 tracking-wider uppercase">备注</th>
                          <th className="w-10 px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, idx) => {
                          const rowErrors = (errors.rows?.[idx] || {}) as Record<string, { message?: string }>;
                          return (
                            <tr key={field.id} className="border-b border-forest-600/6 hover:bg-forest-600/[0.03] transition-colors group">
                              <td className="px-3 py-2.5 text-center">
                                <span className="text-xs font-mono text-forest-600/40">{String(idx + 1).padStart(2, '0')}</span>
                              </td>
                              <td className="px-3 py-2.5 min-w-[140px]">
                                <Controller
                                  name={`rows.${idx}.sampleId`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      placeholder="A-001"
                                      className={cn(
                                        'input-field !py-2 !text-sm font-mono',
                                        rowErrors.sampleId && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    />
                                  )}
                                />
                                {rowErrors.sampleId && <div className="input-error">{rowErrors.sampleId.message}</div>}
                              </td>
                              <td className="px-3 py-2.5 min-w-[120px]">
                                <Controller
                                  name={`rows.${idx}.ph`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="number"
                                      step="0.1"
                                      {...field}
                                      value={field.value as number}
                                      placeholder="6.5-7.5"
                                      className={cn(
                                        'input-field !py-2 !text-sm',
                                        rowErrors.ph && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    />
                                  )}
                                />
                                {rowErrors.ph && <div className="input-error">{rowErrors.ph.message}</div>}
                              </td>
                              <td className="px-3 py-2.5 min-w-[140px]">
                                <Controller
                                  name={`rows.${idx}.organicMatter`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="number"
                                      step="0.1"
                                      {...field}
                                      value={field.value as number}
                                      placeholder="0-500"
                                      className={cn(
                                        'input-field !py-2 !text-sm',
                                        rowErrors.organicMatter && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    />
                                  )}
                                />
                                {rowErrors.organicMatter && <div className="input-error">{rowErrors.organicMatter.message}</div>}
                              </td>
                              <td className="px-3 py-2.5 min-w-[120px]">
                                <Controller
                                  name={`rows.${idx}.temperature`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="number"
                                      step="0.1"
                                      {...field}
                                      value={field.value as number}
                                      placeholder="15-25"
                                      className={cn(
                                        'input-field !py-2 !text-sm',
                                        rowErrors.temperature && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2.5 min-w-[120px]">
                                <Controller
                                  name={`rows.${idx}.moisture`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      type="number"
                                      step="0.1"
                                      {...field}
                                      value={field.value as number}
                                      placeholder="20-60"
                                      className={cn(
                                        'input-field !py-2 !text-sm',
                                        rowErrors.moisture && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2.5 min-w-[180px]">
                                <Controller
                                  name={`rows.${idx}.soilType`}
                                  control={control}
                                  render={({ field }) => (
                                    <select
                                      {...field}
                                      value={field.value}
                                      className={cn(
                                        'input-field !py-2 !text-sm appearance-none pr-9',
                                        rowErrors.soilType && '!border-status-critical !ring-status-critical/10'
                                      )}
                                    >
                                      <option value="">选择类型...</option>
                                      {soilTypes.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label} · {s.region}</option>
                                      ))}
                                    </select>
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2.5 min-w-[180px]">
                                <Controller
                                  name={`rows.${idx}.notes`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      placeholder="采样深度、处理条件..."
                                      className="input-field !py-2 !text-sm"
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => remove(idx)}
                                  disabled={fields.length === 1}
                                  className="w-8 h-8 rounded-lg border border-forest-600/10 flex items-center justify-center text-forest-600/40 hover:text-status-critical hover:border-status-critical/30 hover:bg-status-critical/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 bg-forest-gradient/[0.03] border-t border-forest-600/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-forest-600/60">
                      <Info className="w-4 h-4" />
                      <span>数据将通过严格的质控校验流程后入库，异常值将自动标记</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => append({ sampleId: '', ph: NaN, organicMatter: NaN, temperature: NaN, moisture: NaN, soilType: '', notes: '' })}
                      className="btn-secondary text-sm py-2"
                    >
                      <Plus className="w-4 h-4" />
                      添加样本行
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-3 card overflow-hidden"
            >
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-loam-gradient/10 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-loam-600" />
                  </div>
                  <div>
                    <div className="section-title">宏基因组文件上传</div>
                    <div className="section-subtitle">支持 FASTQ / FASTA / BAM 格式 · 单文件最大 20GB</div>
                  </div>
                </div>
                <span className="badge-info">
                  <CloudUpload className="w-3.5 h-3.5" />
                  断点续传
                </span>
              </div>
              <div className="card-body space-y-5">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative cursor-pointer rounded-2xl border-2 border-dashed p-8 lg:p-12 text-center transition-all duration-250',
                    dragActive
                      ? 'border-forest-500 bg-forest-gradient/10 scale-[1.01] shadow-cardHover'
                      : 'border-forest-600/20 bg-forest-gradient/[0.03] hover:border-forest-600/40 hover:bg-forest-gradient/[0.05]'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".fastq,.fastq.gz,.fq,.fq.gz,.fasta,.fa,.bam,.sam,.vcf.gz"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <motion.div
                    animate={dragActive ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      'w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-5',
                      dragActive ? 'bg-forest-gradient shadow-glowSuccess' : 'bg-white shadow-card border border-forest-600/10'
                    )}
                  >
                    <Upload className={cn('w-9 h-9', dragActive ? 'text-white' : 'text-forest-500')} />
                  </motion.div>
                  <div className="text-lg font-semibold text-forest-800 mb-1">
                    {dragActive ? '松开鼠标即可上传' : '拖拽测序文件到此处'}
                  </div>
                  <div className="text-sm text-forest-600/60 mb-4">
                    或 <span className="text-forest-600 font-medium underline underline-offset-2">点击选择本地文件</span> · 支持批量多选
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    {['FASTQ(.gz)', 'FASTA', 'BAM/SAM', 'VCF'].map((f) => (
                      <span key={f} className="px-2.5 py-1 rounded-lg bg-white border border-forest-600/10 text-forest-700 font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {files.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {files.map((f) => {
                        const StatusIcon = f.status === 'done' ? CheckCircle2 : f.status === 'error' ? AlertCircle : CloudUpload;
                        return (
                          <motion.div
                            key={f.id}
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                            className="group flex items-center gap-4 p-3.5 rounded-xl border border-forest-600/10 bg-white/80 hover:border-forest-600/20 hover:bg-white transition-all"
                          >
                            <div className={cn(
                              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                              f.status === 'done' && 'bg-status-success/10',
                              f.status === 'uploading' && 'bg-forest-gradient/10',
                              f.status === 'error' && 'bg-status-critical/10'
                            )}>
                              <FileText className={cn(
                                'w-5 h-5',
                                f.status === 'done' && 'text-status-success',
                                f.status === 'uploading' && 'text-forest-600',
                                f.status === 'error' && 'text-status-critical'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium text-forest-800 truncate">{f.name}</div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(f.id)}
                                  className="w-7 h-7 rounded-lg border border-transparent flex items-center justify-center text-forest-600/30 hover:text-status-critical hover:bg-status-critical/5 hover:border-status-critical/20 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-forest-600/60">
                                <span className="font-mono px-1.5 py-0.5 rounded bg-forest-gradient/10 text-forest-700">{f.type}</span>
                                <span>{formatSize(f.size)}</span>
                                <span className="ml-auto flex items-center gap-1">
                                  <StatusIcon className={cn(
                                    'w-3.5 h-3.5',
                                    f.status === 'done' && 'text-status-success',
                                    f.status === 'uploading' && 'text-forest-600 animate-pulse',
                                    f.status === 'error' && 'text-status-critical'
                                  )} />
                                  {f.status === 'done' ? '上传完成' : f.status === 'error' ? '失败' : `${Math.round(f.progress)}%`}
                                </span>
                              </div>
                              {f.status === 'uploading' && (
                                <div className="mt-2 h-1.5 rounded-full bg-forest-600/10 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-forest-gradient relative overflow-hidden"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${f.progress}%` }}
                                    transition={{ duration: 0.4 }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress" />
                                  </motion.div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="lg:col-span-2 space-y-5"
            >
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                  </div>
                  <div>
                    <div className="section-title">上传前质检</div>
                    <div className="section-subtitle">系统自动检测文件完整性</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: '文件完整性校验', desc: 'MD5 hash 匹配检测', ok: true },
                    { label: '测序质量分布', desc: 'Q30 ≥ 85% 基准线', ok: true },
                    { label: '接头序列污染', desc: 'Truseq / Nextera 文库', ok: false },
                    { label: '参考基因组索引', desc: 'Triticum aestivum v2.1', ok: true },
                  ].map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-forest-gradient/[0.03] border border-forest-600/8">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        c.ok ? 'bg-status-success/15' : 'bg-status-warning/15'
                      )}>
                        {c.ok
                          ? <CheckCircle2 className="w-4 h-4 text-status-success" />
                          : <AlertCircle className="w-4 h-4 text-status-warning" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-forest-800">{c.label}</div>
                        <div className="text-xs text-forest-600/60 mt-0.5">{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-forest-gradient/[0.04] via-white to-loam-gradient/[0.04]">
                <div className="section-title mb-1.5">引用建议</div>
                <div className="section-subtitle mb-5">上传数据将自动生成引用格式</div>
                <div className="p-4 rounded-xl bg-white/90 border border-forest-600/10 font-mono text-xs text-forest-700 leading-relaxed shadow-card">
                  <span className="text-loam-600">@dataset</span>{'{'}soilsim-2026-{Date.now().toString().slice(-6)},
                  <br />
                  &nbsp;&nbsp;title <span className="text-status-critical">= </span>&quot;土壤微生物群落多组学数据集&quot;,
                  <br />
                  &nbsp;&nbsp;year <span className="text-status-critical">= </span>2026,
                  <br />
                  &nbsp;&nbsp;url <span className="text-status-critical">= </span>&quot;https://soilsim.cn/archive&quot;
                  <br />
                  {'}'}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="sticky bottom-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-forest-600/10 bg-white/90 backdrop-blur-xl shadow-cardHover"
          >
            <div className="flex items-center gap-3 text-sm">
              {isValid
                ? <CheckCircle2 className="w-5 h-5 text-status-success" />
                : <AlertCircle className="w-5 h-5 text-status-warning" />}
              <div>
                <span className={cn('font-medium', isValid ? 'text-forest-800' : 'text-status-warning')}>
                  {isValid ? '数据校验通过' : '请修正表单中的错误'}
                </span>
                <span className="text-forest-600/60 mx-2">·</span>
                <span className="text-forest-600/60">{fields.length} 条理化记录 · {doneFiles}/{files.length} 个文件就绪</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="btn-ghost text-sm">
                保存草稿
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting || files.every(f => f.status !== 'done')}
                className="btn-primary text-sm py-3"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" fill="none" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    提交入库
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.form>
      </div>
    </AppLayout>
  );
}
