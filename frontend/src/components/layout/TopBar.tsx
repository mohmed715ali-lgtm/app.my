import { usePromptStore } from '../../stores/promptStore';

export function TopBar() {
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const setSearchQuery = usePromptStore((s) => s.setSearchQuery);
  const currentPage = usePromptStore((s) => s.currentPage);
  const viewMode = usePromptStore((s) => s.viewMode);
  const setViewMode = usePromptStore((s) => s.setViewMode);
  const sortField = usePromptStore((s) => s.sortField);
  const setSortField = usePromptStore((s) => s.setSortField);
  const sortOrder = usePromptStore((s) => s.sortOrder);
  const setSortOrder = usePromptStore((s) => s.setSortOrder);
  const createPrompt = usePromptStore((s) => s.createPrompt);
  const selectedIds = usePromptStore((s) => s.selectedIds);
  const deleteSelected = usePromptStore((s) => s.deleteSelected);
  const clearSelection = usePromptStore((s) => s.clearSelection);
  const selectAll = usePromptStore((s) => s.selectAll);

  const isSelecting = selectedIds.size > 0;

  if (currentPage === 'settings') {
    return (
      <header className="h-14 bg-bg-secondary border-b border-border-primary flex items-center px-5">
        <h2 className="text-lg font-semibold text-text-primary">الإعدادات</h2>
      </header>
    );
  }

  const pageTitle = currentPage === 'favorites' ? 'المفضلة' : 'البرومبتات';

  return (
    <header className="h-14 bg-bg-secondary border-b border-border-primary flex items-center gap-3 px-5">
      <h2 className="text-lg font-semibold text-text-primary ml-4">{pageTitle}</h2>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="بحث في البرومبتات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-tertiary text-text-primary text-sm rounded-lg pr-9 pl-3 py-2 border border-border-primary focus:border-accent transition-colors placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Selection Actions */}
        {isSelecting && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs text-text-secondary">{selectedIds.size} محدد</span>
            <button
              onClick={selectAll}
              className="text-xs text-accent hover:text-accent-hover transition-colors px-2 py-1"
            >
              تحديد الكل
            </button>
            <button
              onClick={deleteSelected}
              className="text-xs text-danger hover:text-danger-hover transition-colors px-2 py-1"
            >
              حذف المحدد
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1"
            >
              إلغاء
            </button>
            <div className="w-px h-5 bg-border-primary" />
          </div>
        )}

        {/* Sort */}
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as typeof sortField)}
          className="bg-bg-tertiary text-text-secondary text-xs rounded-lg px-2 py-1.5 border border-border-primary cursor-pointer"
        >
          <option value="updated_at">آخر تعديل</option>
          <option value="created_at">تاريخ الإنشاء</option>
          <option value="title">العنوان</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="bg-bg-tertiary text-text-secondary text-xs rounded-lg px-2 py-1.5 border border-border-primary hover:text-text-primary transition-colors"
          title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        {/* View Mode Toggle */}
        <div className="flex bg-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1.5 text-xs transition-colors ${
              viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            ☰
          </button>
        </div>

        {/* New Prompt */}
        <button
          onClick={() => createPrompt('', '', [])}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
        >
          + جديد
        </button>
      </div>
    </header>
  );
}
