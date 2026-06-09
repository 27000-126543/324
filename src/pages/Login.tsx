import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Sprout,
  AlertCircle,
  FlaskConical,
  GraduationCap,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, ROLE_LABELS } from '@/stores/authStore';

const demoAccounts = [
  { username: 'chief_sci', password: 'chief123', role: 'CHIEF_SCIENTIST', icon: ShieldCheck, desc: '首席科学家' },
  { username: 'soil_expert', password: 'soil123', role: 'SOIL_EXPERT', icon: FlaskConical, desc: '土壤健康专家' },
  { username: 'microbe_val', password: 'micro123', role: 'MICROBE_VALIDATOR', icon: GraduationCap, desc: '微生物验证员' },
  { username: 'ecologist', password: 'eco123', role: 'ECOLOGIST', icon: Leaf, desc: '生态研究员' },
  { username: 'farm', password: 'farm123', role: 'FARM_ADMIN', icon: Building2, desc: '农场管理员' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setErrorMessage('用户名或密码错误，请检查后重试');
      }
    } catch {
      setErrorMessage('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (acc: typeof demoAccounts[number]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-forest-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-noise opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(134,187,160,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(52,130,96,0.2),_transparent_50%)]" />

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-forest-400/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-loam-400/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="absolute top-20 left-20 opacity-20">
        <Sprout className="w-16 h-16 text-forest-200 animate-float" />
      </div>
      <div className="absolute bottom-32 right-24 opacity-15">
        <BookOpen className="w-20 h-20 text-forest-100 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-forest-900/40 backdrop-blur-2xl border-r border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Leaf className="w-6 h-6 text-forest-200" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-xl tracking-tight">
                SoilSim
              </div>
              <div className="text-xs text-forest-200/70">土壤微生物模拟平台 v2.4</div>
            </div>
          </div>

          <div className="space-y-6 my-12">
            <h1 className="font-display text-4xl font-bold text-white leading-tight tracking-tight">
              探索土壤微观
              <br />
              <span className="text-forest-300">世界的奥秘</span>
            </h1>
            <p className="text-forest-100/80 leading-relaxed text-lg max-w-md">
              基于宏基因组学与多物理场耦合模拟，助力科研人员揭示土壤生态系统中微生物群落的结构、功能与演变规律。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-forest-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-forest-200" />
              </div>
              <div>
                <div className="text-white font-medium">2,847+ 研究人员</div>
                <div className="text-xs text-forest-200/60">正在使用本平台</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-loam-500/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-loam-200" />
              </div>
              <div>
                <div className="text-white font-medium">15.6万+ 模拟任务</div>
                <div className="text-xs text-forest-200/60">累计成功运行</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-xs text-forest-200/50">
              © 2026 土壤微生物学重点实验室 · 学术使用许可
            </div>
          </div>
        </div>

        <div className="relative bg-cream/95 backdrop-blur-2xl p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-forest-300/10 blur-3xl" />

          <motion.form
            onSubmit={handleSubmit}
            className="relative z-10 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="lg:hidden flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-forest-gradient flex items-center justify-center shadow-card">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-forest-800 text-lg">SoilSim</span>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold text-forest-800 tracking-tight">
                欢迎回来
              </h2>
              <p className="mt-2 text-forest-600/70">
                请登录以继续您的研究工作
              </p>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-status-critical/10 border border-status-critical/20"
              >
                <AlertCircle className="w-5 h-5 text-status-critical flex-shrink-0" />
                <span className="text-sm font-medium text-status-critical">{errorMessage}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="input-label">用户名 / 工号</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-600/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名或工号"
                  className="input-field pl-12"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="input-label mb-0">登录密码</label>
                <a
                  href="#"
                  className="text-xs text-forest-600 hover:text-forest-700 font-medium"
                >
                  忘记密码?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-600/40" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-12 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-600/40 hover:text-forest-600 transition-colors"
                >
                  {showPwd ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !username || !password}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className={cn(
                'w-full btn-primary py-3.5 text-base relative overflow-hidden',
                loading && 'opacity-80'
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                      fill="none"
                    />
                    <path
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                    />
                  </svg>
                  正在验证身份...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  登录平台
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </motion.button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-forest-600/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-cream/95 text-xs text-forest-600/50">
                  演示账号（点击快速填充）
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <motion.button
                    key={acc.username}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      'bg-white/80 border-forest-600/10 hover:bg-white hover:border-forest-500/30 hover:shadow-card',
                      username === acc.username && password === acc.password && 'bg-forest-gradient/10 border-forest-500/40 shadow-card'
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-forest-gradient/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-forest-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-forest-800">{acc.username}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-50 text-forest-600 font-medium">
                          {ROLE_LABELS[acc.role as keyof typeof ROLE_LABELS]}
                        </span>
                      </div>
                      <div className="text-xs text-forest-600/60 mt-0.5">
                        密码: {acc.password} · {acc.desc}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
