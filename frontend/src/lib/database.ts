import Database from '@tauri-apps/plugin-sql';
import type { Prompt } from '../types';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:715.db');
  }
  return db;
}

// ============ PROMPTS ============

export async function getAllPrompts(): Promise<Prompt[]> {
  const d = await getDb();
  return await d.select<Prompt[]>('SELECT * FROM prompts ORDER BY updated_at DESC');
}

export async function createPrompt(title: string, content: string, tags: string): Promise<Prompt> {
  const d = await getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const result = await d.execute(
    'INSERT INTO prompts (title, content, tags, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
    [title, content, tags, now, now]
  );
  const rows = await d.select<Prompt[]>('SELECT * FROM prompts WHERE id = $1', [result.lastInsertId]);
  return rows[0];
}

export async function updatePrompt(id: number, title: string, content: string, tags: string): Promise<Prompt> {
  const d = await getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await d.execute(
    'UPDATE prompts SET title = $1, content = $2, tags = $3, updated_at = $4 WHERE id = $5',
    [title, content, tags, now, id]
  );
  const rows = await d.select<Prompt[]>('SELECT * FROM prompts WHERE id = $1', [id]);
  return rows[0];
}

export async function deletePrompt(id: number): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM prompts WHERE id = $1', [id]);
}

export async function deleteMultiplePrompts(ids: number[]): Promise<void> {
  const d = await getDb();
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  await d.execute(`DELETE FROM prompts WHERE id IN (${placeholders})`, ids);
}

export async function toggleFavorite(id: number, isFavorite: boolean): Promise<void> {
  const d = await getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  await d.execute(
    'UPDATE prompts SET is_favorite = $1, updated_at = $2 WHERE id = $3',
    [isFavorite ? 1 : 0, now, id]
  );
}

export async function duplicatePrompt(id: number): Promise<Prompt> {
  const d = await getDb();
  const rows = await d.select<Prompt[]>('SELECT * FROM prompts WHERE id = $1', [id]);
  if (!rows[0]) throw new Error('Prompt not found');
  const p = rows[0];
  return await createPrompt(p.title + ' (نسخة)', p.content, p.tags);
}

// ============ SETTINGS ============

export async function getSettings(): Promise<Record<string, string>> {
  const d = await getDb();
  const rows = await d.select<{ key: string; value: string }[]>('SELECT * FROM settings');
  const settings: Record<string, string> = {};
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  return settings;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  await d.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
    [key, value]
  );
}
