const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const { SOCKET_ORIGIN, SOCKET_PATH } = (() => {
    try {
        const url = new URL(API_URL);
        const p = url.pathname.replace(/\/$/, '');
        return {
            SOCKET_ORIGIN: url.origin,
            SOCKET_PATH: p === '' ? '/socket.io' : `${p}/socket.io`,
        };
    } catch {
        return { SOCKET_ORIGIN: API_URL, SOCKET_PATH: '/socket.io' };
    }
})();
