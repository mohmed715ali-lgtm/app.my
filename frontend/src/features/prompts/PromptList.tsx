import { usePromptStore } from '../../stores/promptStore';
import { PromptCard } from './PromptCard';

export function PromptList() {
  const filteredPrompts = usePromptStore((s) => s.getFilteredPrompts());
  const viewMode = usePromptStore((s) => s.viewMode);
  const isLoading = usePromptStore((s) => s.isLoading);
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const activeTag = usePromptStore((s) => s.activeTag);
  const currentPage = usePromptStore((s) => s.currentPage);
  const createPrompt = usePromptStore((s) => s.createPrompt);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-muted text-sm">جاري التحميل...</div>
      </div>
    );
  }

  if (filteredPrompts.length === 0) {
    const hasFilter = searchQuery || activeTag;
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl opacity-30">{hasFilter ? '🔍' : '📝'}</div>
          <div className="text-text-muted text-sm">
            {hasFilter
              ? 'لا توجد نتائج مطابقة'
              : currentPage === 'favorites'
              ? 'لا توجد برومبتات مفضلة'
              : 'لا توجد برومبتات بعد'}
          </div>
          {!hasFilter && currentPage !== 'favorites' && (
            <button
              onClick={() => createPrompt('', '', [])}
              className="text-accent hover:text-accent-hover text-sm transition-colors"
            >
              + إنشاء برومبت جديد
            </button>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filteredPrompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}
