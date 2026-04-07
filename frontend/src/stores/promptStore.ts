import { create } from 'zustand';
import type { ParsedPrompt, SortField, SortOrder, ViewMode, Page } from '../types';
import { parsePrompt, serializeTags } from '../types';
import * as db from '../lib/database';

interface PromptStore {
  prompts: ParsedPrompt[];
  selectedPrompt: ParsedPrompt | null;
  selectedIds: Set<number>;
  searchQuery: string;
  activeTag: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  currentPage: Page;
  isEditing: boolean;
  isLoading: boolean;

  // Actions
  loadPrompts: () => Promise<void>;
  createPrompt: (title: string, content: string, tags: string[]) => Promise<void>;
  updatePrompt: (id: number, title: string, content: string, tags: string[]) => Promise<void>;
  deletePrompt: (id: number) => Promise<void>;
  deleteSelected: () => Promise<void>;
  duplicatePrompt: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  selectPrompt: (prompt: ParsedPrompt | null) => void;
  toggleSelect: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: Page) => void;
  setIsEditing: (editing: boolean) => void;
  getFilteredPrompts: () => ParsedPrompt[];
  getAllTags: () => string[];
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  prompts: [],
  selectedPrompt: null,
  selectedIds: new Set(),
  searchQuery: '',
  activeTag: null,
  sortField: 'updated_at',
  sortOrder: 'desc',
  viewMode: 'grid',
  currentPage: 'prompts',
  isEditing: false,
  isLoading: false,

  loadPrompts: async () => {
    set({ isLoading: true });
    try {
      const raw = await db.getAllPrompts();
      const prompts = raw.map(parsePrompt);
      set({ prompts, isLoading: false });
    } catch (e) {
      console.error('Failed to load prompts:', e);
      set({ isLoading: false });
    }
  },

  createPrompt: async (title, content, tags) => {
    const raw = await db.createPrompt(title, content, serializeTags(tags));
    const parsed = parsePrompt(raw);
    set((s) => ({ prompts: [parsed, ...s.prompts], selectedPrompt: parsed, isEditing: true }));
  },

  updatePrompt: async (id, title, content, tags) => {
    const raw = await db.updatePrompt(id, title, content, serializeTags(tags));
    const parsed = parsePrompt(raw);
    set((s) => ({
      prompts: s.prompts.map((p) => (p.id === id ? parsed : p)),
      selectedPrompt: s.selectedPrompt?.id === id ? parsed : s.selectedPrompt,
    }));
  },

  deletePrompt: async (id) => {
    await db.deletePrompt(id);
    set((s) => ({
      prompts: s.prompts.filter((p) => p.id !== id),
      selectedPrompt: s.selectedPrompt?.id === id ? null : s.selectedPrompt,
      isEditing: s.selectedPrompt?.id === id ? false : s.isEditing,
    }));
  },

  deleteSelected: async () => {
    const ids = Array.from(get().selectedIds);
    if (ids.length === 0) return;
    await db.deleteMultiplePrompts(ids);
    set((s) => ({
      prompts: s.prompts.filter((p) => !s.selectedIds.has(p.id)),
      selectedPrompt: s.selectedIds.has(s.selectedPrompt?.id ?? -1) ? null : s.selectedPrompt,
      selectedIds: new Set(),
      isEditing: s.selectedIds.has(s.selectedPrompt?.id ?? -1) ? false : s.isEditing,
    }));
  },

  duplicatePrompt: async (id) => {
    const raw = await db.duplicatePrompt(id);
    const parsed = parsePrompt(raw);
    set((s) => ({ prompts: [parsed, ...s.prompts] }));
  },

  toggleFavorite: async (id) => {
    const prompt = get().prompts.find((p) => p.id === id);
    if (!prompt) return;
    const newVal = !prompt.is_favorite;
    await db.toggleFavorite(id, newVal);
    set((s) => ({
      prompts: s.prompts.map((p) => (p.id === id ? { ...p, is_favorite: newVal ? 1 : 0 } : p)),
      selectedPrompt:
        s.selectedPrompt?.id === id ? { ...s.selectedPrompt, is_favorite: newVal ? 1 : 0 } : s.selectedPrompt,
    }));
  },

  selectPrompt: (prompt) => set({ selectedPrompt: prompt, isEditing: !!prompt }),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAll: () =>
    set((s) => ({
      selectedIds: new Set(s.getFilteredPrompts().map((p) => p.id)),
    })),
  clearSelection: () => set({ selectedIds: new Set() }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentPage: (page) => set({ currentPage: page, selectedPrompt: null, isEditing: false }),
  setIsEditing: (editing) => set({ isEditing: editing }),

  getFilteredPrompts: () => {
    const { prompts, searchQuery, activeTag, sortField, sortOrder, currentPage } = get();
    let filtered = [...prompts];

    if (currentPage === 'favorites') {
      filtered = filtered.filter((p) => p.is_favorite === 1);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeTag) {
      filtered = filtered.filter((p) => p.tags.includes(activeTag));
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title, 'ar');
      } else {
        cmp = a[sortField].localeCompare(b[sortField]);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  },

  getAllTags: () => {
    const { prompts } = get();
    const tagSet = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ar'));
  },
}));
