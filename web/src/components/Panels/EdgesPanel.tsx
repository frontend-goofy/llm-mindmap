import { useMemo } from 'react';
import { useDeleteEdge, useEdges } from '../../api/hooks';
import { Button } from '../UI/Button';
import toast from 'react-hot-toast';

export type EdgesPanelProps = {
  nodeId: string;
};

export const EdgesPanel = ({ nodeId }: EdgesPanelProps) => {
  const { data: edges = [], isLoading } = useEdges();
  const deleteEdge = useDeleteEdge();

  const relatedEdges = useMemo(
    () => edges.filter((edge) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId),
    [edges, nodeId]
  );

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
    );
  }

  if (relatedEdges.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No edges connected to this node yet.</div>
    );
  }

  return (
    <section className="space-y-4 p-4 text-sm">
      {relatedEdges.map((edge) => (
        <div
          key={edge.id}
          className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-100">
              {edge.fromNodeId} → {edge.toNodeId}
            </div>
            {edge.label ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">{edge.label}</div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            className="text-xs text-rose-600 dark:text-rose-400"
            onClick={() =>
              deleteEdge.mutate(edge.id, {
                onError: (error) => toast.error((error as Error).message)
              })
            }
          >
            Remove
          </Button>
        </div>
      ))}
    </section>
  );
};
