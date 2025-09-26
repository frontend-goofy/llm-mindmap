import { useState } from 'react';
import { Canvas } from './components/Canvas/Canvas';
import { ChatPanel } from './components/Chat/ChatPanel';
import { NodeSettings } from './components/Panels/NodeSettings';
import { EdgesPanel } from './components/Panels/EdgesPanel';
import { useUIStore } from './store/useUI';
import { Button } from './components/UI/Button';

const tabs = ['chat', 'settings', 'edges'] as const;
type TabKey = (typeof tabs)[number];

function RightPanel() {
  const selectedNodeId = useUIStore((state) => state.selectedNodeId);
  const [activeTab, setActiveTab] = useState<TabKey>('chat');

  if (!selectedNodeId) {
    return (
      <aside className="flex w-96 flex-col border-l border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500 dark:text-slate-400">
          Select a node to view its details.
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-96 flex-col border-l border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-700">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chat' ? <ChatPanel nodeId={selectedNodeId} /> : null}
        {activeTab === 'settings' ? <NodeSettings nodeId={selectedNodeId} /> : null}
        {activeTab === 'edges' ? <EdgesPanel nodeId={selectedNodeId} /> : null}
      </div>
    </aside>
  );
}

const App = () => {
  return (
    <div className="flex h-full min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex-1">
        <Canvas />
      </div>
      <RightPanel />
    </div>
  );
};

export default App;
