import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { translateText, type Language } from '../utils/i18n';

interface LocaleState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'bn' : 'en' }),
      t: (key, params) => translateText(get().language, key, params),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
