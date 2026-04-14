const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Returns the access-controlled file URL for an image or video.
 * All file access goes through the authenticated endpoint which checks visibility permissions.
 */
export function getImageUrl(imageId: string): string {
  return `${API_URL}/files/image/${imageId}`;
}

export function getVideoUrl(videoId: string): string {
  return `${API_URL}/files/video/${videoId}`;
}

export function getDocumentUrl(documentId: string): string {
  return `${API_URL}/files/document/${documentId}`;
}

/**
 * Fetch a document via the authenticated API client and open it in a new tab.
 * Direct browser navigation to document URLs fails with 403 because the
 * access token lives in Redux (Authorization header), not in cookies.
 */
export async function openDocument(documentId: string): Promise<void> {
  const { api } = await import('./api/client');
  const { data } = await api.get<Blob>(`/files/document/${documentId}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
