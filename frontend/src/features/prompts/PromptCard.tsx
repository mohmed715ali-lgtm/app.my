import { useCallback } from 'react';
import { usePromptStore } from '../../stores/promptStore';
import type { ParsedPrompt } from '../../types';

interface Props {
  prompt: ParsedPrompt;
}

const tagColors = [
  'bg-tag-1/20 text-tag-1 border-tag-1/30',
  'bg-tag-2/20 text-tag-2 border-tag-2/30',
  'bg-tag-3/20 text-tag-3 border-tag-3/30',
  'bg-tag-4/20 text-tag-4 border-tag-4/30',
  'bg-tag-5/20 text-tag-5 border-tag-5/30',
  'bg-tag-6/20 text-tag-6 border-tag-6/30',
];

export function PromptCard({ prompt }: Props) {
  const selectPrompt = usePromptStore((s) => s.selectPrompt);
  const selectedPrompt = usePromptStore((s) => s.selectedPrompt);
  const toggleSelect = usePromptStore((s) => s.toggleSelect);
  const selectedIds = usePromptStore((s) => s.selectedIds);
  const toggleFavorite = usePromptStore((s) => s.toggleFavorite);
  const deletePrompt = usePromptStore((s) => s.deletePrompt);
  const duplicatePrompt = usePromptStore((s) => s.duplicatePrompt);
  const viewMode = usePromptStore((s) => s.viewMode);

  const isSelected = selectedPrompt?.id === prompt.id;
  const isChecked = selectedIds.has(prompt.id);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        toggleSelect(prompt.id);
      } else {
        selectPrompt(prompt);
      }
    },
    [prompt, selectPrompt, toggleSelect]
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(prompt.id);
    },
    [prompt.id, toggleFavorite]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deletePrompt(prompt.id);
    },
    [prompt.id, deletePrompt]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      duplicatePrompt(prompt.id);
    },
    [prompt.id, duplicatePrompt]
  );

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    } catch {
      return d;
    }
  };

  const preview = prompt.content.slice(0, 120) + (prompt.content.length > 120 ? '...' : '');

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 px-4 py-3 border-b border-border-primary cursor-pointer transition-all group ${
          isSelected ? 'bg-accent/10 border-r-2 border-r-accent' : 'hover:bg-bg-hover'
        } ${isChecked ? 'bg-accent/5' : ''}`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleSelect(prompt.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-accent shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {prompt.title || 'بدون عنوان'}
            </h3>
            {prompt.tags.slice(0, 3).map((tag, i) => (
              <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${tagColors[i % tagColors.length]}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">{preview || 'بدون محتوى'}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleFavorite} className="p-1 hover:bg-bg-active rounded text-xs" title="المفضلة">
            {prompt.is_favorite ? '⭐' : '☆'}
          </button>
          <button onClick={handleDuplicate} className="p-1 hover:bg-bg-active rounded text-xs" title="نسخ">
            📋
          </button>
          <button onClick={handleDelete} className="p-1 hover:bg-bg-active rounded text-xs text-danger" title="حذف">
            🗑
          </button>
        </div>

        <span className="text-[10px] text-text-muted shrink-0">{formatDate(prompt.updated_at)}</span>
      </div>
    );
  }

  // Grid View
  return (
    <div
      onClick={handleClick}
      className={`bg-bg-card border rounded-xl p-4 cursor-pointer transition-all group animate-fade-in hover:border-border-secondary hover:shadow-lg hover:shadow-black/10 ${
        isSelected ? 'border-accent shadow-accent/10' : 'border-border-primary'
      } ${isChecked ? 'ring-1 ring-accent/40' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => toggleSelect(prompt.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 accent-accent shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {prompt.title || 'بدون عنوان'}
          </h3>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleFavorite} className="p-1 hover:bg-bg-hover rounded text-xs" title="المفضلة">
            {prompt.is_favorite ? '⭐' : '☆'}
          </button>
          <button onClick={handleDuplicate} className="p-1 hover:bg-bg-hover rounded text-xs" title="نسخ">
            📋
          </button>
          <button onClick={handleDelete} className="p-1 hover:bg-bg-hover rounded text-xs text-danger" title="حذف">
            🗑
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-3 min-h-[3rem]">
        {preview || 'بدون محتوى'}
      </p>

      {/* Tags */}
      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {prompt.tags.slice(0, 4).map((tag, i) => (
            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${tagColors[i % tagColors.length]}`}>
              {tag}
            </span>
          ))}
          {prompt.tags.length > 4 && (
            <span className="text-[10px] text-text-muted px-1">+{prompt.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border-primary">
        <span className="text-[10px] text-text-muted">{formatDate(prompt.updated_at)}</span>
        {prompt.is_favorite === 1 && <span className="text-xs">⭐</span>}
      </div>
    </div>
  );
}
