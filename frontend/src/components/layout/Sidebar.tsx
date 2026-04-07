import { usePromptStore } from '../../stores/promptStore';
import type { Page } from '../../types';

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'prompts', label: 'البرومبتات', icon: '📝' },
  { id: 'favorites', label: 'المفضلة', icon: '⭐' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

export function Sidebar() {
  const currentPage = usePromptStore((s) => s.currentPage);
  const setCurrentPage = usePromptStore((s) => s.setCurrentPage);
  const prompts = usePromptStore((s) => s.prompts);
  const allTags = usePromptStore((s) => s.getAllTags());
  const activeTag = usePromptStore((s) => s.activeTag);
  const setActiveTag = usePromptStore((s) => s.setActiveTag);

  const favCount = prompts.filter((p) => p.is_favorite === 1).length;

  const tagColors = [
    'bg-tag-1/20 text-tag-1',
    'bg-tag-2/20 text-tag-2',
    'bg-tag-3/20 text-tag-3',
    'bg-tag-4/20 text-tag-4',
    'bg-tag-5/20 text-tag-5',
    'bg-tag-6/20 text-tag-6',
  ];

  return (
    <aside className="w-60 h-full bg-bg-secondary border-l border-border-primary flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-border-primary">
        <h1 className="text-xl font-bold text-accent tracking-wider">715</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[11px] text-text-muted uppercase tracking-wider mb-2 px-2">التنقل</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentPage(item.id);
              setActiveTag(null);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentPage === item.id && !activeTag
                ? 'bg-accent/15 text-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'prompts' && (
              <span className="mr-auto text-[11px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                {prompts.length}
              </span>
            )}
            {item.id === 'favorites' && favCount > 0 && (
              <span className="mr-auto text-[11px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                {favCount}
              </span>
            )}
          </button>
        ))}

        {/* Tags Section */}
        {allTags.length > 0 && currentPage !== 'settings' && (
          <>
            <div className="text-[11px] text-text-muted uppercase tracking-wider mt-5 mb-2 px-2">الوسوم</div>
            <div className="space-y-0.5">
              {allTags.map((tag, i) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTag(activeTag === tag ? null : tag);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    activeTag === tag
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tagColors[i % tagColors.length].split(' ')[0]}`} />
                  <span>{tag}</span>
                  <span className="mr-auto text-[10px] text-text-muted">
                    {prompts.filter((p) => p.tags.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border-primary">
        <div className="text-[10px] text-text-muted text-center leading-relaxed">
          <div>© 715</div>
          <div className="mt-0.5">Instagram: m715c</div>
        </div>
      </div>
    </aside>
  );
}
