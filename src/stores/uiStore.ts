import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface UploadedFileDraft {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

export interface UploadDraftRow {
  sampleId: string;
  ph: number;
  organicMatter: number;
  temperature: number;
  moisture: number;
  soilType: string;
  notes?: string;
}

export interface UploadDraft {
  rows: UploadDraftRow[];
  files: UploadedFileDraft[];
  savedAt?: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  globalLoading: boolean;
  loadingText: string;
  breadcrumbs: { label: string; path?: string }[];
  toasts: ToastMessage[];
  activeTab: string;
  uploadDraft: UploadDraft | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setGlobalLoading: (loading: boolean, text?: string) => void;
  setBreadcrumbs: (breadcrumbs: { label: string; path?: string }[]) => void;
  setActiveTab: (tab: string) => void;

  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  saveUploadDraft: (draft: UploadDraft) => void;
  clearUploadDraft: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

const applyThemeToDocument = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'light',
      effectiveTheme: 'light',
      globalLoading: false,
      loadingText: '加载中...',
      breadcrumbs: [],
      toasts: [],
      activeTab: '',
      uploadDraft: null,

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      setTheme: (theme: Theme) => {
        const effective = getEffectiveTheme(theme);
        applyThemeToDocument(effective);
        set({ theme, effectiveTheme: effective });
      },

      toggleTheme: () => {
        const current = get().theme;
        const order: Theme[] = ['light', 'dark', 'system'];
        const next = order[(order.indexOf(current) + 1) % order.length];
        get().setTheme(next);
      },

      setGlobalLoading: (loading: boolean, text?: string) => {
        set({ globalLoading: loading, loadingText: text || '加载中...' });
      },

      setBreadcrumbs: (breadcrumbs: { label: string; path?: string }[]) => {
        set({ breadcrumbs });
      },

      setActiveTab: (tab: string) => {
        set({ activeTab: tab });
      },

      showToast: (toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newToast: ToastMessage = {
          duration: 3000,
          ...toast,
          id,
        };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }
      },

      removeToast: (id: string) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      showSuccess: (message: string, title?: string) => {
        get().showToast({ type: 'success', message, title });
      },

      showError: (message: string, title?: string) => {
        get().showToast({ type: 'error', message, title, duration: 5000 });
      },

      showWarning: (message: string, title?: string) => {
        get().showToast({ type: 'warning', message, title });
      },

      showInfo: (message: string, title?: string) => {
        get().showToast({ type: 'info', message, title });
      },

      saveUploadDraft: (draft: UploadDraft) => {
        set({ uploadDraft: { ...draft, savedAt: new Date().toISOString() } });
      },

      clearUploadDraft: () => {
        set({ uploadDraft: null });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        uploadDraft: state.uploadDraft,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const effective = getEffectiveTheme(state.theme);
          state.effectiveTheme = effective;
          applyThemeToDocument(effective);
        }
      },
    }
  )
);
