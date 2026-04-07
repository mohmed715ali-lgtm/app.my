import { useSettingsStore } from '../../stores/settingsStore';

export function SettingsPanel() {
  const { theme, fontSize, autoSave, viewMode, updateSetting } = useSettingsStore();

  const sections = [
    {
      title: 'عام',
      icon: '⚙️',
      items: [
        {
          label: 'المظهر',
          description: 'اختر المظهر المفضل',
          control: (
            <select
              value={theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="bg-bg-tertiary text-text-primary text-sm rounded-lg px-3 py-1.5 border border-border-primary cursor-pointer min-w-[120px]"
            >
              <option value="dark">داكن</option>
              <option value="light">فاتح</option>
            </select>
          ),
        },
        {
          label: 'طريقة العرض',
          description: 'طريقة عرض البرومبتات',
          control: (
            <select
              value={viewMode}
              onChange={(e) => updateSetting('view_mode', e.target.value)}
              className="bg-bg-tertiary text-text-primary text-sm rounded-lg px-3 py-1.5 border border-border-primary cursor-pointer min-w-[120px]"
            >
              <option value="grid">شبكة</option>
              <option value="list">قائمة</option>
            </select>
          ),
        },
      ],
    },
    {
      title: 'المحرر',
      icon: '✏️',
      items: [
        {
          label: 'حجم الخط',
          description: 'حجم خط المحرر',
          control: (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => updateSetting('font_size', e.target.value)}
                className="w-24 accent-accent"
              />
              <span className="text-sm text-text-secondary w-8 text-center">{fontSize}</span>
            </div>
          ),
        },
        {
          label: 'الحفظ التلقائي',
          description: 'حفظ التغييرات تلقائياً',
          control: (
            <button
              onClick={() => updateSetting('auto_save', autoSave === 'true' ? 'false' : 'true')}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoSave === 'true' ? 'bg-accent' : 'bg-bg-active'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  autoSave === 'true' ? 'right-0.5' : 'right-[22px]'
                }`}
              />
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{section.icon}</span>
              <h3 className="text-sm font-semibold text-text-primary">{section.title}</h3>
            </div>
            <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i < section.items.length - 1 ? 'border-b border-border-primary' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm text-text-primary">{item.label}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{item.description}</div>
                  </div>
                  {item.control}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* About */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">ℹ️</span>
            <h3 className="text-sm font-semibold text-text-primary">حول</h3>
          </div>
          <div className="bg-bg-card border border-border-primary rounded-xl p-5 text-center space-y-2">
            <div className="text-2xl font-bold text-accent">715</div>
            <div className="text-xs text-text-secondary">نظام إدارة البرومبتات الاحترافي</div>
            <div className="text-[11px] text-text-muted">الإصدار 1.0.0</div>
            <div className="pt-2 border-t border-border-primary mt-3">
              <div className="text-[11px] text-text-muted">© 715</div>
              <div className="text-[11px] text-text-muted mt-0.5">Instagram: m715c</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
