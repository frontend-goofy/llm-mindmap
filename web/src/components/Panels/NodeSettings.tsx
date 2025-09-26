import { useEffect, useState } from 'react';
import { useNode, useUpdateNode } from '../../api/hooks';
import { Button } from '../UI/Button';
import toast from 'react-hot-toast';

export type NodeSettingsProps = {
  nodeId: string;
};

export const NodeSettings = ({ nodeId }: NodeSettingsProps) => {
  const { data: node, isLoading } = useNode(nodeId);
  const updateNode = useUpdateNode();
  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState('');

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setSettings(node.settings ? JSON.stringify(node.settings, null, 2) : '');
    }
  }, [node]);

  const handleSave = async () => {
    try {
      let parsedSettings: unknown = undefined;
      if (settings.trim()) {
        parsedSettings = JSON.parse(settings);
      }
      await updateNode.mutateAsync({ id: nodeId, title, settings: parsedSettings });
      toast.success('Node updated');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (isLoading || !node) {
    return (
      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col space-y-4 p-4 text-sm">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Title
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex-1">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Settings (JSON)
        </label>
        <textarea
          className="h-full min-h-[160px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={settings}
          onChange={(event) => setSettings(event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Created {new Date(node.createdAt).toLocaleString()}</span>
        <span>Updated {new Date(node.updatedAt).toLocaleString()}</span>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateNode.isPending}>
          {updateNode.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </section>
  );
};
