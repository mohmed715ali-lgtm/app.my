import { create } from 'zustand';
import * as db from '../lib/database';

interface SettingsStore {
  theme: string;
  language: string;
  fontSize: string;
  autoSave: string;
  viewMode: string;
  loaded: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  language: 'ar',
  fontSize: '16',
  autoSave: 'true',
  viewMode: 'grid',
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await db.getSettings();
      set({
        theme: settings.theme || 'dark',
        language: settings.language || 'ar',
        fontSize: settings.font_size || '16',
        autoSave: settings.auto_save || 'true',
        viewMode: settings.view_mode || 'grid',
        loaded: true,
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ loaded: true });
    }
  },

  updateSetting: async (key: string, value: string) => {
    await db.setSetting(key, value);
    const keyMap: Record<string, string> = {
      theme: 'theme',
      language: 'language',
      font_size: 'fontSize',
      auto_save: 'autoSave',
      view_mode: 'viewMode',
    };
    const stateKey = keyMap[key];
    if (stateKey) {
      set({ [stateKey]: value } as Record<string, string>);
    }
  },
}));
