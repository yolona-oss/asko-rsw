export type ErrorEntry = {
  id: string;
  title: string;
  message: string;
  details?: string;
};

type Listener = () => void;

let errors: ErrorEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn();
}

export const errorStore = {
  getSnapshot(): ErrorEntry[] {
    return errors;
  },

  show(message: string, title = 'Ошибка', details?: string): string {
    const id = Math.random().toString(36).slice(2);
    errors = [...errors, { id, title, message, details }];
    emit();
    return id;
  },

  dismiss(id: string) {
    errors = errors.filter((e) => e.id !== id);
    emit();
  },

  dismissAll() {
    errors = [];
    emit();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Extract a human-readable message from an Axios error or generic Error. */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as any;
    if (e.response?.data?.message) {
      const msg = e.response.data.message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    if (e.message === 'Network Error') {
      return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    if (e.code === 'ECONNABORTED') {
      return 'Превышено время ожидания ответа от сервера.';
    }
    if (e.message && typeof e.message === 'string') {
      return e.message;
    }
  }
  return 'Произошла непредвиденная ошибка.';
}
