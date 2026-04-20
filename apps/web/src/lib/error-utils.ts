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
