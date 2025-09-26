import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from './client';
import type { MindEdge, MindMessage, MindNode, Paginated } from '../types';

const nodesKey = ['nodes'];
const nodeKey = (id: string) => [...nodesKey, id];
const edgesKey = ['edges'];
const messagesKey = (nodeId?: string) => ['messages', nodeId];

export const useNodes = () =>
  useQuery({
    queryKey: nodesKey,
    queryFn: async () => {
      const data = await get<Paginated<MindNode>>('/nodes');
      return data.items;
    }
  });

export const useEdges = () =>
  useQuery({
    queryKey: edgesKey,
    queryFn: async () => {
      const data = await get<Paginated<MindEdge>>('/edges');
      return data.items;
    }
  });

export const useNode = (id?: string) =>
  useQuery({
    queryKey: nodeKey(id ?? ''),
    queryFn: async () => get<MindNode>(`/nodes/${id}`),
    enabled: Boolean(id)
  });

export const useCreateNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MindNode> & { title: string }) =>
      post<MindNode>('/nodes', payload),
    onSuccess: (node) => {
      queryClient.setQueryData<MindNode[] | undefined>(nodesKey, (prev) =>
        prev ? [...prev, node] : [node]
      );
    }
  });
};

export const useUpdateNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MindNode>) =>
      patch<MindNode>(`/nodes/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: nodesKey });
      const previous = queryClient.getQueryData<MindNode[]>(nodesKey);
      if (previous) {
        queryClient.setQueryData<MindNode[]>(nodesKey, (old = []) =>
          old.map((node) => (node.id === id ? { ...node, ...data } : node))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(nodesKey, context.previous);
      }
    },
    onSuccess: (node) => {
      queryClient.setQueryData<MindNode[]>(nodesKey, (old = []) =>
        old.map((item) => (item.id === node.id ? node : item))
      );
      queryClient.setQueryData(nodeKey(node.id), node);
    }
  });
};

export const useDeleteNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ ok: boolean }>(`/nodes/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: nodesKey });
      const previousNodes = queryClient.getQueryData<MindNode[]>(nodesKey);
      queryClient.setQueryData<MindNode[]>(nodesKey, (old = []) =>
        old.filter((node) => node.id !== id)
      );
      return { previousNodes };
    },
    onError: (_error, _id, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodesKey, context.previousNodes);
      }
    },
    onSuccess: (_res, id) => {
      queryClient.removeQueries({ queryKey: nodeKey(id) });
      queryClient.invalidateQueries({ queryKey: edgesKey });
    }
  });
};

export const useMoveNode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      post<{ ok: boolean; node: MindNode }>(`/nodes/${id}/move`, { x, y }),
    onMutate: async ({ id, x, y }) => {
      await queryClient.cancelQueries({ queryKey: nodesKey });
      const previousNodes = queryClient.getQueryData<MindNode[]>(nodesKey);
      queryClient.setQueryData<MindNode[]>(nodesKey, (old = []) =>
        old.map((node) =>
          node.id === id ? { ...node, posX: x, posY: y } : node
        )
      );
      return { previousNodes };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNodes) {
        queryClient.setQueryData(nodesKey, context.previousNodes);
      }
    },
    onSuccess: ({ node }) => {
      queryClient.setQueryData<MindNode[]>(nodesKey, (old = []) =>
        old.map((item) => (item.id === node.id ? node : item))
      );
    }
  });
};

export const useLinkEdge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromNodeId, toNodeId, label }: { fromNodeId: string; toNodeId: string; label?: string }) =>
      post<MindEdge>(`/nodes/${fromNodeId}/link`, { toNodeId, label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edgesKey });
    }
  });
};

export const useDeleteEdge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (edgeId: string) => del<{ ok: boolean }>(`/edges/${edgeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edgesKey });
    }
  });
};

export const useMessages = (nodeId?: string) =>
  useQuery({
    queryKey: messagesKey(nodeId),
    queryFn: async () => {
      if (!nodeId) return [] as MindMessage[];
      const data = await get<{ items: MindMessage[] }>(
        `/nodes/${nodeId}/messages`
      );
      return data.items;
    },
    enabled: Boolean(nodeId)
  });

export const usePostMessage = (nodeId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; meta?: Record<string, unknown> }) =>
      post<{ user: MindMessage; assistant: MindMessage }>(
        `/nodes/${nodeId}/messages`,
        { role: 'user', ...payload }
      ),
    onSuccess: (data) => {
      if (!nodeId) return;
      queryClient.setQueryData<MindMessage[]>(messagesKey(nodeId), (old = []) => [
        ...old,
        data.user,
        data.assistant
      ]);
    }
  });
};

export const useFork = (nodeId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fromMessageId: string; title?: string }) =>
      post<{ node: MindNode; edge: MindEdge; copied: number }>(
        `/nodes/${nodeId}/fork`,
        payload
      ),
    onSuccess: ({ node }) => {
      queryClient.setQueryData<MindNode[] | undefined>(nodesKey, (prev) =>
        prev ? [...prev, node] : [node]
      );
      queryClient.invalidateQueries({ queryKey: edgesKey });
    }
  });
};
