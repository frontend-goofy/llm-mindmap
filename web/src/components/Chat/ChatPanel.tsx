import { FormEvent, useMemo, useRef, useState } from 'react';
import { useFork, useMessages, usePostMessage } from '../../api/hooks';
import { MindMessage } from '../../types';
import { MessageItem } from './MessageItem';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from '../UI/Spinner';
import { Button } from '../UI/Button';
import { Dialog } from '../UI/Dialog';
import toast from 'react-hot-toast';
import { useUIStore } from '../../store/useUI';

export type ChatPanelProps = {
  nodeId: string;
};

export const ChatPanel = ({ nodeId }: ChatPanelProps) => {
  const { data: messages = [], isLoading } = useMessages(nodeId);
  const postMessage = usePostMessage(nodeId);
  const forkNode = useFork(nodeId);
  const [input, setInput] = useState('');
  const [forkMessage, setForkMessage] = useState<MindMessage | null>(null);
  const [forkTitle, setForkTitle] = useState('');
  const setSelectedNode = useUIStore((state) => state.setSelectedNode);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const rowVirtualizer = useVirtualizer({
    count: sortedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 6
  });

  useEffect(() => {
    if (sortedMessages.length > 0) {
      rowVirtualizer.scrollToIndex(sortedMessages.length - 1, { align: 'end' });
    }
  }, [rowVirtualizer, sortedMessages.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    try {
      await postMessage.mutateAsync({ content: input.trim() });
      setInput('');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleFork = async () => {
    if (!forkMessage) return;
    try {
      const { node } = await forkNode.mutateAsync({
        fromMessageId: forkMessage.id,
        title: forkTitle || forkMessage.content.slice(0, 40) || 'New branch'
      });
      setForkMessage(null);
      setForkTitle('');
      setSelectedNode(node.id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-slate-200 p-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Chat
      </header>
      <div ref={parentRef} className="flex-1 overflow-y-auto bg-slate-50/60 p-4 dark:bg-slate-900/40">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = sortedMessages[virtualRow.index];
              return (
                <div
                  key={message.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className="flex flex-col"
                >
                  <MessageItem message={message} onFork={setForkMessage} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 dark:border-slate-700">
        <textarea
          className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask something about this idea..."
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Shift + Enter for newline
          </span>
          <Button type="submit" disabled={postMessage.isPending}>
            {postMessage.isPending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>

      <Dialog
        open={Boolean(forkMessage)}
        onClose={() => {
          setForkMessage(null);
          setForkTitle('');
        }}
        title="Fork node"
        description="Create a new branch from this message."
        onConfirm={handleFork}
        confirmLabel={forkNode.isPending ? 'Forking…' : 'Fork'}
        confirmDisabled={forkNode.isPending}
      >
        <p className="text-sm text-slate-500 dark:text-slate-300">
          New node will copy conversation up to the selected message.
        </p>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900"
          value={forkTitle}
          onChange={(event) => setForkTitle(event.target.value)}
          placeholder="Optional title"
        />
      </Dialog>
    </section>
  );
};
