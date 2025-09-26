import { Handle, Position } from 'react-flow-renderer';
import clsx from 'classnames';
import { MindNode } from '../../types';
import { useUIStore } from '../../store/useUI';

export type MindNodeData = {
  node: MindNode;
};

export const NodeRenderer = ({ data, selected }: { data: MindNodeData; selected: boolean }) => {
  const openContextMenu = useUIStore((state) => state.openContextMenu);
  const setSelectedNode = useUIStore((state) => state.setSelectedNode);

  return (
    <div
      onClick={() => setSelectedNode(data.node.id)}
      onContextMenu={(event) => {
        event.preventDefault();
        openContextMenu({
          nodeId: data.node.id,
          x: event.clientX,
          y: event.clientY
        });
      }}
      className={clsx(
        'group rounded-lg border bg-white/90 px-4 py-2 shadow backdrop-blur transition dark:bg-slate-800/90',
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/40'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {data.node.title || 'Untitled node'}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {new Date(data.node.updatedAt).toLocaleString()}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3" />
      <Handle type="target" position={Position.Left} className="!h-3 !w-3" />
    </div>
  );
};
