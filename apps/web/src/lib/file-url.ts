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
