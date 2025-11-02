import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../lib/i18n';

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  bufferHours: number;
  setBufferHours: (hours: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
      bufferHours: 2,
      setBufferHours: (bufferHours) => set({ bufferHours }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
