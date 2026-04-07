export interface Prompt {
  id: number;
  title: string;
  content: string;
  tags: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export interface ParsedPrompt extends Omit<Prompt, 'tags'> {
  tags: string[];
}

export interface Settings {
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
  font_size: string;
  auto_save: string;
  view_mode: 'grid' | 'list';
}

export type SortField = 'created_at' | 'updated_at' | 'title';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type Page = 'prompts' | 'favorites' | 'settings';

export function parsePrompt(p: Prompt): ParsedPrompt {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(p.tags);
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    tags = [];
  }
  return { ...p, tags };
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}
