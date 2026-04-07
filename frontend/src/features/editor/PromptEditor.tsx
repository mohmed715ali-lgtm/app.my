import { useState, useEffect, useRef, useCallback } from 'react';
import { usePromptStore } from '../../stores/promptStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function PromptEditor() {
  const selectedPrompt = usePromptStore((s) => s.selectedPrompt);
  const isEditing = usePromptStore((s) => s.isEditing);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);
  const deletePrompt = usePromptStore((s) => s.deletePrompt);
  const toggleFavorite = usePromptStore((s) => s.toggleFavorite);
  const selectPrompt = usePromptStore((s) => s.selectPrompt);
  const setIsEditing = usePromptStore((s) => s.setIsEditing);
  const autoSave = useSettingsStore((s) => s.autoSave);
  const fontSize = useSettingsStore((s) => s.fontSize);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedPrompt) {
      setTitle(selectedPrompt.title);
      setContent(selectedPrompt.content);
      setTags([...selectedPrompt.tags]);
    }
  }, [selectedPrompt?.id]);

  const doSave = useCallback(() => {
    if (!selectedPrompt) return;
    updatePrompt(selectedPrompt.id, title, content, tags);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [selectedPrompt, title, content, tags, updatePrompt]);

  // Auto-save
  useEffect(() => {
    if (!selectedPrompt || autoSave !== 'true') return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (
        title !== selectedPrompt.title ||
        content !== selectedPrompt.content ||
        JSON.stringify(tags) !== JSON.stringify(selectedPrompt.tags)
      ) {
        doSave();
      }
    }, 800);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [title, content, tags, selectedPrompt, autoSave, doSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        doSave();
      }
      if (e.key === 'Escape') {
        if (isFocusMode) setIsFocusMode(false);
        else {
          selectPrompt(null);
          setIsEditing(false);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
        e.preventDefault();
        if (selectedPrompt) deletePrompt(selectedPrompt.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSave, isFocusMode, selectedPrompt, selectPrompt, setIsEditing, deletePrompt]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (!selectedPrompt || !isEditing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center space-y-2 opacity-40">
          <div className="text-5xl">📝</div>
          <div className="text-text-muted text-sm">اختر برومبت للتعديل</div>
          <div className="text-text-muted text-[11px]">أو اضغط "+ جديد" لإنشاء واحد</div>
        </div>
      </div>
    );
  }

  const tagColors = [
    'bg-tag-1/20 text-tag-1 border-tag-1/30',
    'bg-tag-2/20 text-tag-2 border-tag-2/30',
    'bg-tag-3/20 text-tag-3 border-tag-3/30',
    'bg-tag-4/20 text-tag-4 border-tag-4/30',
    'bg-tag-5/20 text-tag-5 border-tag-5/30',
    'bg-tag-6/20 text-tag-6 border-tag-6/30',
  ];

  return (
    <div
      className={`flex flex-col bg-bg-primary transition-all ${
        isFocusMode ? 'fixed inset-0 z-50 bg-bg-primary' : 'flex-1'
      }`}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-primary bg-bg-secondary">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              selectPrompt(null);
              setIsEditing(false);
            }}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            →
          </button>
          <div className="text-xs text-text-muted">
            {saved ? (
              <span className="text-success animate-fade-in">تم الحفظ ✓</span>
            ) : autoSave === 'true' ? (
              'حفظ تلقائي'
            ) : (
              'Ctrl+S للحفظ'
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFavorite(selectedPrompt.id)}
            className="p-1.5 hover:bg-bg-hover rounded-lg text-sm transition-colors"
            title="المفضلة"
          >
            {selectedPrompt.is_favorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-1.5 hover:bg-bg-hover rounded-lg text-sm transition-colors ${
              isFocusMode ? 'text-accent' : ''
            }`}
            title="وضع التركيز"
          >
            {isFocusMode ? '⊡' : '⊞'}
          </button>
          {autoSave !== 'true' && (
            <button
              onClick={doSave}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
            >
              حفظ
            </button>
          )}
          <button
            onClick={() => deletePrompt(selectedPrompt.id)}
            className="p-1.5 hover:bg-danger/10 rounded-lg text-sm text-danger transition-colors"
            title="حذف"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-5 pt-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان البرومبت..."
          className="w-full bg-transparent text-xl font-bold text-text-primary placeholder:text-text-muted/40 border-none focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div className="px-5 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${tagColors[i % tagColors.length]}`}
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:opacity-70 mr-0.5">
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="+ وسم"
            className="bg-transparent text-xs text-text-secondary placeholder:text-text-muted/40 border-none focus:outline-none w-20"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-5 pb-4 overflow-hidden">
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب البرومبت هنا..."
          style={{ fontSize: `${fontSize}px` }}
          className="w-full h-full bg-transparent text-text-primary leading-relaxed resize-none placeholder:text-text-muted/30 focus:outline-none"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-5 py-1.5 border-t border-border-primary bg-bg-secondary text-[10px] text-text-muted">
        <div className="flex items-center gap-3">
          <span>{content.length} حرف</span>
          <span>{content.split(/\s+/).filter(Boolean).length} كلمة</span>
          <span>{content.split('\n').length} سطر</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Esc للخروج</span>
          <span>Ctrl+S حفظ</span>
        </div>
      </div>
    </div>
  );
}
