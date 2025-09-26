import { Fragment, ReactNode } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { Button } from './Button';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  dismissLabel?: string;
  confirmDisabled?: boolean;
};

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmLabel = 'Confirm',
  dismissLabel = 'Cancel',
  confirmDisabled = false
}: DialogProps) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-slate-800">
                <HeadlessDialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </HeadlessDialog.Title>
                {description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                ) : null}

                <div className="mt-4 space-y-4 text-slate-700 dark:text-slate-200">
                  {children}
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <Button variant="ghost" onClick={onClose}>
                    {dismissLabel}
                  </Button>
                  {onConfirm ? (
                    <Button onClick={onConfirm} disabled={confirmDisabled}>
                      {confirmLabel}
                    </Button>
                  ) : null}
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  );
};
