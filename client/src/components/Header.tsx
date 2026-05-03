import { Sun, Moon, Languages } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import NotificationCenter from './NotificationCenter';
import { useLocaleStore } from '../store/localeStore';

interface MenuItem {
  path: string;
  label: string;
}

interface HeaderProps {
  currentPage: MenuItem | undefined;
}

const Header = ({ currentPage }: HeaderProps) => {
  useAuthStore();
  const { language, toggleLanguage, t } = useLocaleStore();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const t = localStorage.getItem('theme');
      if (t === 'light' || t === 'dark') return t;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <header
      className="h-12 flex items-center justify-between px-5 flex-shrink-0 bg-white dark:bg-[#111318] border-b border-gray-200 dark:border-white/[0.055]"
      style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: 'var(--bg)', borderBottomColor: 'var(--panel-bg)' }}
    >
      {/* Left — page title + date */}
      <div className="flex items-center gap-2.5">
        <h2 className="text-[13.5px] font-semibold text-gray-900 dark:text-[#c8cdd8] tracking-tight leading-none" style={{ color: 'var(--body-text)' }}>
          {t(currentPage?.label ?? 'Dashboard')}
        </h2>
        <span className="w-[3px] h-[3px] rounded-full bg-[#e9b633]" />
        <span className="text-[11.5px] text-gray-600 dark:text-[#bbbfcb] font-normal" style={{ color: 'var(--muted-2)' }}>
          {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        
        <div className="relative">
          <NotificationCenter />
        </div>

        <button
          title={language === 'en' ? 'Translate to Bangla' : 'Translate to English'}
          onClick={toggleLanguage}
          aria-pressed={language === 'bn'}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-2.5 text-[12px] font-semibold text-gray-700 dark:text-[#fafafa] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-[120ms]"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
        >
          <Languages size={13} strokeWidth={1.8} />
          {language === 'en' ? 'E to B' : 'B to E'}
        </button>

        <button
          title="Toggle color mode"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-700 dark:text-[#fafafa] transition-all duration-[120ms]"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
        >
          {theme === 'dark' ? <Sun size={14} strokeWidth={1.6} /> : <Moon size={14} strokeWidth={1.6} />}
        </button>

        {/* Divider */}
        <div className="w-px h-[18px] bg-white/[0.07] mx-1" />
      </div>
    </header>
  );
};

export default Header;