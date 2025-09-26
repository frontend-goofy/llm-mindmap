export type MindNode = {
  id: string;
  title: string;
  parentId?: string | null;
  posX: number;
  posY: number;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type MindEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string | null;
  createdAt: string;
};

export type MindMessage = {
  id: string;
  nodeId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
};
