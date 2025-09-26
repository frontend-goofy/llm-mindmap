import { create } from 'zustand';

type ContextMenuState = {
  nodeId: string;
  x: number;
  y: number;
};

type RenameDialogState = {
  nodeId: string;
  title: string;
};

type CreateChildState = {
  parentId: string;
};

type UIState = {
  selectedNodeId?: string;
  setSelectedNode: (id?: string) => void;
  contextMenu: ContextMenuState | null;
  openContextMenu: (payload: ContextMenuState) => void;
  closeContextMenu: () => void;
  renameDialog: RenameDialogState | null;
  openRenameDialog: (payload: RenameDialogState) => void;
  closeRenameDialog: () => void;
  createChildDialog: CreateChildState | null;
  openCreateChildDialog: (payload: CreateChildState) => void;
  closeCreateChildDialog: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: undefined,
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  contextMenu: null,
  openContextMenu: (payload) => set({ contextMenu: payload }),
  closeContextMenu: () => set({ contextMenu: null }),
  renameDialog: null,
  openRenameDialog: (payload) => set({ renameDialog: payload }),
  closeRenameDialog: () => set({ renameDialog: null }),
  createChildDialog: null,
  openCreateChildDialog: (payload) => set({ createChildDialog: payload }),
  closeCreateChildDialog: () => set({ createChildDialog: null })
}));
