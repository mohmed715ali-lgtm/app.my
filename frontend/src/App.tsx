import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { PromptList } from './features/prompts/PromptList';
import { PromptEditor } from './features/editor/PromptEditor';
import { SettingsPanel } from './features/settings/SettingsPanel';
import { usePromptStore } from './stores/promptStore';
import { useSettingsStore } from './stores/settingsStore';

export default function App() {
  const loadPrompts = usePromptStore((s) => s.loadPrompts);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const currentPage = usePromptStore((s) => s.currentPage);
  const isEditing = usePromptStore((s) => s.isEditing);

  useEffect(() => {
    loadPrompts();
    loadSettings();
  }, [loadPrompts, loadSettings]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          {currentPage === 'settings' ? (
            <SettingsPanel />
          ) : (
            <>
              <div className={`flex flex-col ${isEditing ? 'w-[360px] shrink-0 border-l border-border-primary' : 'flex-1'}`}>
                <PromptList />
              </div>
              {isEditing && <PromptEditor />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
