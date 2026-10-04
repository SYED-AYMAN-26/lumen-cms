import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 4200);
  }, []);

  const confirm = useCallback((options) => new Promise((resolve) => {
    setDialog({
      title: 'Are you sure?',
      message: '',
      confirmLabel: 'Confirm',
      danger: false,
      ...options,
      resolve,
    });
  }), []);

  const closeDialog = (answer) => {
    dialog?.resolve(answer);
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((item) => (
          <div key={item.id} className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-card ${item.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-line bg-white text-ink'}`}>
            {item.message}
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="card w-full max-w-md p-5" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2 id="confirm-title" className="font-serif text-2xl">{dialog.title}</h2>
            {dialog.message && <p className="mt-2 text-sm leading-6 text-stone-600">{dialog.message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => closeDialog(false)}>Cancel</button>
              <button className={dialog.danger ? 'btn-danger' : 'btn-primary'} onClick={() => closeDialog(true)}>{dialog.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
