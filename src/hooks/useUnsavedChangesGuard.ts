import { useCallback, useEffect, useRef, useState } from 'react';

export function useUnsavedChangesGuard(isDirty: boolean) {
  const [modalOpen, setModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setModalOpen(true);
    },
    [isDirty],
  );

  const confirmLeave = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setModalOpen(false);
    action?.();
  }, []);

  const cancelLeave = useCallback(() => {
    pendingActionRef.current = null;
    setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  return { requestLeave, confirmLeave, cancelLeave, modalOpen };
}
