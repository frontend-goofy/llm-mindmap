import { useCallback, useEffect, useState } from 'react';
import 'react-flow-renderer/dist/style.css';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowInstance,
  Connection,
  Edge as FlowEdge,
  Node as FlowNode,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'react-flow-renderer';
import {
  useNodes,
  useEdges,
  useCreateNode,
  useMoveNode,
  useDeleteNode,
  useLinkEdge,
  useDeleteEdge,
  useUpdateNode
} from '../../api/hooks';
import { NodeRenderer, MindNodeData } from './NodeRenderer';
import { MindEdge } from '../../types';
import { useUIStore } from '../../store/useUI';
import { Dialog } from '../UI/Dialog';
import { Spinner } from '../UI/Spinner';
import toast from 'react-hot-toast';

const nodeTypes = {
  mindNode: NodeRenderer
};

export const Canvas = () => {
  const { data: nodesData = [], isLoading: loadingNodes } = useNodes();
  const { data: edgesData = [], isLoading: loadingEdges } = useEdges();
  const createNode = useCreateNode();
  const moveNode = useMoveNode();
  const deleteNode = useDeleteNode();
  const linkEdge = useLinkEdge();
  const deleteEdge = useDeleteEdge();
  const updateNode = useUpdateNode();
  const selectedNodeId = useUIStore((state) => state.selectedNodeId);
  const setSelectedNode = useUIStore((state) => state.setSelectedNode);
  const contextMenu = useUIStore((state) => state.contextMenu);
  const closeContextMenu = useUIStore((state) => state.closeContextMenu);
  const renameDialog = useUIStore((state) => state.renameDialog);
  const openRenameDialog = useUIStore((state) => state.openRenameDialog);
  const closeRenameDialog = useUIStore((state) => state.closeRenameDialog);
  const createChildDialog = useUIStore((state) => state.createChildDialog);
  const openCreateChildDialog = useUIStore((state) => state.openCreateChildDialog);
  const closeCreateChildDialog = useUIStore((state) => state.closeCreateChildDialog);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [flowNodes, setFlowNodes] = useState<FlowNode<MindNodeData>[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);

  useEffect(() => {
    const mappedNodes: FlowNode<MindNodeData>[] = nodesData.map((node) => ({
      id: node.id,
      type: 'mindNode',
      data: { node },
      position: { x: node.posX, y: node.posY }
    }));
    setFlowNodes(mappedNodes);
  }, [nodesData]);

  useEffect(() => {
    const mappedEdges: FlowEdge[] = edgesData.map((edge: MindEdge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      label: edge.label ?? undefined,
      type: 'default'
    }));
    setFlowEdges(mappedEdges);
  }, [edgesData]);

  const onNodesChange = useCallback(
    (changes: NodeChange<MindNodeData>[]) =>
      setFlowNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handlePaneDoubleClick = useCallback(
    async (event: React.MouseEvent) => {
      if (!reactFlowInstance) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
      try {
        const node = await createNode.mutateAsync({
          title: 'New node',
          position: { x: position.x, y: position.y }
        });
        setSelectedNode(node.id);
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    [createNode, reactFlowInstance, setSelectedNode]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: FlowNode<MindNodeData>) => {
      moveNode.mutate(
        { id: node.id, x: node.position.x, y: node.position.y },
        {
          onError: (error) => toast.error((error as Error).message)
        }
      );
    },
    [moveNode]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      linkEdge.mutate(
        { fromNodeId: connection.source, toNodeId: connection.target },
        { onError: (error) => toast.error((error as Error).message) }
      );
    },
    [linkEdge]
  );

  const handleNodesDelete = useCallback(
    (nodes: FlowNode<MindNodeData>[]) => {
      nodes.forEach((node) =>
        deleteNode.mutate(node.id, {
          onError: (error) => toast.error((error as Error).message)
        })
      );
    },
    [deleteNode]
  );

  const handleEdgesDelete = useCallback(
    (edges: FlowEdge[]) => {
      edges.forEach((edge) =>
        deleteEdge.mutate(edge.id, {
          onError: (error) => toast.error((error as Error).message)
        })
      );
    },
    [deleteEdge]
  );

  const handleRename = useCallback(() => {
    if (!renameDialog) return;
    updateNode.mutate(
      { id: renameDialog.nodeId, title: renameDialog.title },
      {
        onSuccess: () => {
          closeRenameDialog();
        },
        onError: (error) => {
          toast.error((error as Error).message);
        }
      }
    );
  }, [closeRenameDialog, renameDialog, updateNode]);

  const handleCreateChild = useCallback(
    async (title: string) => {
      if (!createChildDialog) return;
      const parent = nodesData.find((n) => n.id === createChildDialog.parentId);
      const offsetX = 220;
      const offsetY = 80;
      const position = parent
        ? { x: parent.posX + offsetX, y: parent.posY + offsetY }
        : { x: 100, y: 100 };
      try {
        const node = await createNode.mutateAsync({
          title,
          parentId: createChildDialog.parentId,
          position
        });
        setSelectedNode(node.id);
        closeCreateChildDialog();
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    [closeCreateChildDialog, createChildDialog, createNode, nodesData, setSelectedNode]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' && selectedNodeId) {
        deleteNode.mutate(selectedNodeId, {
          onError: (error) => toast.error((error as Error).message)
        });
        setSelectedNode(undefined);
      }
    },
    [deleteNode, selectedNodeId, setSelectedNode]
  );

  const [childTitle, setChildTitle] = useState('');

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [closeContextMenu, contextMenu]);

  if (loadingNodes || loadingEdges) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneDoubleClick={handlePaneDoubleClick}
        onInit={setReactFlowInstance}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onSelectionChange={(params) => {
          const node = params?.nodes?.[0];
          setSelectedNode(node?.id);
        }}
        fitView
        panOnDrag
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>

      {contextMenu ? (
        <div
          className="absolute z-40 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              const node = nodesData.find((n) => n.id === contextMenu.nodeId);
              if (node) {
                openRenameDialog({ nodeId: node.id, title: node.title });
              }
              closeContextMenu();
            }}
          >
            Rename
          </button>
          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              openCreateChildDialog({ parentId: contextMenu.nodeId });
              closeContextMenu();
            }}
          >
            New child
          </button>
          <button
            className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
            onClick={() => {
              deleteNode.mutate(contextMenu.nodeId, {
                onError: (error) => toast.error((error as Error).message)
              });
              closeContextMenu();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      <Dialog
        open={Boolean(renameDialog)}
        onClose={closeRenameDialog}
        title="Rename node"
        onConfirm={handleRename}
        confirmLabel={updateNode.isPending ? 'Saving…' : 'Save'}
        confirmDisabled={updateNode.isPending}
      >
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900"
          value={renameDialog?.title ?? ''}
          onChange={(event) =>
            openRenameDialog({
              nodeId: renameDialog?.nodeId ?? '',
              title: event.target.value
            })
          }
          placeholder="Node title"
        />
      </Dialog>

      <Dialog
        open={Boolean(createChildDialog)}
        onClose={() => {
          closeCreateChildDialog();
          setChildTitle('');
        }}
        title="Create child node"
        onConfirm={() => {
          handleCreateChild(childTitle || 'New node');
          setChildTitle('');
        }}
        confirmLabel={createNode.isPending ? 'Creating…' : 'Create'}
        confirmDisabled={createNode.isPending}
      >
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900"
          value={childTitle}
          onChange={(event) => setChildTitle(event.target.value)}
          placeholder="Node title"
        />
      </Dialog>
    </div>
  );
};
