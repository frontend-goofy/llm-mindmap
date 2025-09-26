import { MindMessage } from '../../types';
import { Button } from '../UI/Button';

type MessageItemProps = {
  message: MindMessage;
  onFork: (message: MindMessage) => void;
};

export const MessageItem = ({ message, onFork }: MessageItemProps) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex flex-col space-y-2 rounded-lg border border-transparent px-4 py-3 ${
        isUser
          ? 'self-end bg-indigo-50 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-100'
          : isAssistant
            ? 'self-start bg-slate-100 text-slate-900 dark:bg-slate-800/70 dark:text-slate-100'
            : 'self-start bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
      }`}
    >
      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="uppercase tracking-wide">{message.role}</span>
        <div className="flex items-center space-x-2">
          <span>{new Date(message.createdAt).toLocaleString()}</span>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => onFork(message)}>
            Fork
          </Button>
        </div>
      </div>
    </div>
  );
};
