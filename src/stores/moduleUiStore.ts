import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

type Filters = Record<string, string>;

type ModuleUiState<TFilters extends Filters = Filters> = {
  page: number;
  filters: TFilters;
  modals: Record<string, boolean>;
  successMsg: string;
  errorMsg: string;
};

type ModuleUiStore = {
  modules: Record<string, ModuleUiState>;
  initModule: <TFilters extends Filters>(moduleId: string, filters: TFilters) => void;
  setPage: (moduleId: string, page: number) => void;
  setFilter: (moduleId: string, key: string, value: string) => void;
  resetFilters: <TFilters extends Filters>(moduleId: string, filters: TFilters) => void;
  setModal: (moduleId: string, modal: string, open: boolean) => void;
  setSuccess: (moduleId: string, message: string) => void;
  setError: (moduleId: string, message: string) => void;
  clearMessages: (moduleId: string) => void;
};

function createInitialModule<TFilters extends Filters>(filters: TFilters): ModuleUiState<TFilters> {
  return {
    page: 1,
    filters: { ...filters },
    modals: {},
    successMsg: '',
    errorMsg: '',
  };
}

export const useModuleUiStore = create<ModuleUiStore>((set) => ({
  modules: {},

  initModule: (moduleId, filters) => {
    set((state) => {
      if (state.modules[moduleId]) return state;
      return {
        modules: {
          ...state.modules,
          [moduleId]: createInitialModule(filters),
        },
      };
    });
  },

  setPage: (moduleId, page) => {
    set((state) => ({
      modules: {
        ...state.modules,
        [moduleId]: {
          ...(state.modules[moduleId] ?? createInitialModule({})),
          page,
        },
      },
    }));
  },

  setFilter: (moduleId, key, value) => {
    set((state) => {
      const current = state.modules[moduleId] ?? createInitialModule({});
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            page: 1,
            filters: {
              ...current.filters,
              [key]: value,
            },
          },
        },
      };
    });
  },

  resetFilters: (moduleId, filters) => {
    set((state) => {
      const current = state.modules[moduleId] ?? createInitialModule(filters);
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            page: 1,
            filters: { ...filters },
          },
        },
      };
    });
  },

  setModal: (moduleId, modal, open) => {
    set((state) => {
      const current = state.modules[moduleId] ?? createInitialModule({});
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            modals: {
              ...current.modals,
              [modal]: open,
            },
          },
        },
      };
    });
  },

  setSuccess: (moduleId, message) => {
    set((state) => {
      const current = state.modules[moduleId] ?? createInitialModule({});
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            successMsg: message,
            errorMsg: '',
          },
        },
      };
    });
  },

  setError: (moduleId, message) => {
    set((state) => {
      const current = state.modules[moduleId] ?? createInitialModule({});
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            successMsg: '',
            errorMsg: message,
          },
        },
      };
    });
  },

  clearMessages: (moduleId) => {
    set((state) => {
      const current = state.modules[moduleId];
      if (!current) return state;
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...current,
            successMsg: '',
            errorMsg: '',
          },
        },
      };
    });
  },
}));

export function useModuleUiState<TFilters extends Filters>(moduleId: string, defaultFilters: TFilters) {
  const state = useModuleUiStore((store) => store.modules[moduleId]) as ModuleUiState<TFilters> | undefined;
  const initModule = useModuleUiStore((store) => store.initModule);
  const setPageInStore = useModuleUiStore((store) => store.setPage);
  const setFilterInStore = useModuleUiStore((store) => store.setFilter);
  const resetFiltersInStore = useModuleUiStore((store) => store.resetFilters);
  const setModalInStore = useModuleUiStore((store) => store.setModal);
  const setSuccessInStore = useModuleUiStore((store) => store.setSuccess);
  const setErrorInStore = useModuleUiStore((store) => store.setError);
  const clearMessagesInStore = useModuleUiStore((store) => store.clearMessages);

  useEffect(() => {
    initModule(moduleId, defaultFilters);
  }, [defaultFilters, initModule, moduleId]);

  const current = state ?? createInitialModule(defaultFilters);

  return {
    ...current,
    setPage: useCallback((page: number) => setPageInStore(moduleId, page), [moduleId, setPageInStore]),
    setFilter: useCallback(
      (key: keyof TFilters, value: string) => setFilterInStore(moduleId, String(key), value),
      [moduleId, setFilterInStore],
    ),
    resetFilters: useCallback(
      () => resetFiltersInStore(moduleId, defaultFilters),
      [defaultFilters, moduleId, resetFiltersInStore],
    ),
    setModal: useCallback(
      (modal: string, open: boolean) => setModalInStore(moduleId, modal, open),
      [moduleId, setModalInStore],
    ),
    setSuccess: useCallback(
      (message: string) => setSuccessInStore(moduleId, message),
      [moduleId, setSuccessInStore],
    ),
    setError: useCallback(
      (message: string) => setErrorInStore(moduleId, message),
      [moduleId, setErrorInStore],
    ),
    clearMessages: useCallback(() => clearMessagesInStore(moduleId), [clearMessagesInStore, moduleId]),
  };
}
