import type { CreateReviewDto } from '@asko/shared/client';
import type {
  ReviewRecord,
  PaginatedReviews,
} from './types';
import { api } from './client';

export const reviewApi = {
  create(data: CreateReviewDto) {
    return api.post<ReviewRecord>('/reviews', data);
  },

  getMy() {
    return api.get<ReviewRecord[]>('/reviews/my', { _silent: true } as any);
  },

  getByRepairer(repairerId: string) {
    return api.get<PaginatedReviews>(`/reviews/repairer/${repairerId}`);
  },

  getRating(repairerId: string) {
    return api.get<{ average: number; count: number }>(`/reviews/rating/repairer/${repairerId}`);
  },

  getMyRating() {
    return api.get<{ average: number; count: number }>('/reviews/rating/my');
  },

  getByRequest(requestId: string) {
    return api.get<{ review: ReviewRecord }>(`/reviews/request/${requestId}`, { _silent: true } as any);
  },

};
