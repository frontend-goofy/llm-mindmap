import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => (
  <HotToaster
    position="top-right"
    toastOptions={{
      className:
        'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-800 dark:border-slate-200'
    }}
  />
);
