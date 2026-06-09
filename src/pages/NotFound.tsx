import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TreeDeciduous, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-forest-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-noise opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(134,187,160,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(52,130,96,0.2),_transparent_50%)]" />

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-forest-400/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-loam-400/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-forest-400/30 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
              <TreeDeciduous className="w-16 h-16 text-forest-100 animate-float" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="mb-4">
            <span className="inline-block text-[140px] font-display font-black leading-none bg-gradient-to-br from-forest-100 via-forest-200 to-forest-300 bg-clip-text text-transparent select-none drop-shadow-lg">
              404
            </span>
          </div>

          <h1 className="text-3xl font-display font-bold text-forest-50 mb-3 tracking-tight">
            迷失在森林中
          </h1>
          <p className="text-forest-200/80 mb-10 leading-relaxed max-w-sm mx-auto">
            您寻找的路径似乎不在这片林地中。
            <br />
            让我们回到熟悉的小径继续探索吧。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-forest-700 font-semibold shadow-xl hover:shadow-2xl transition-all"
            >
              <Home className="w-5 h-5" />
              返回工作台
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest-500/20 backdrop-blur-sm text-forest-100 font-semibold border border-forest-400/30 hover:bg-forest-500/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              返回上一页
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 pt-8 border-t border-forest-400/20"
        >
          <p className="text-forest-300/60 text-sm flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            提示：请检查URL是否正确，或使用导航菜单浏览功能
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
