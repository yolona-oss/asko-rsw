import type { CreateReviewDto } from '@asko/shared/client';
import type {
  IReview,
  IImage,
  PaginatedReviews,
} from './types';
import { api } from './client';

export const reviewApi = {
  create(data: CreateReviewDto) {
    return api.post<IReview>('/reviews', data);
  },

  getMy() {
    return api.get<IReview[]>('/reviews/my', { _silent: true } as any);
  },

  getByRepairer(repairerId: string) {
    return api.get<PaginatedReviews>(`/reviews/repairer/${repairerId}`);
  },

  getRating(repairerId: string) {
    return api.get<{ average: number; count: number }>(`/reviews/rating/repairer/${repairerId}`);
  },

  uploadImage(reviewId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/reviews/${reviewId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
