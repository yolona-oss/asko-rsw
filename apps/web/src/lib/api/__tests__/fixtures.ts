/**
 * Typed test fixtures built from OpenAPI-generated DTOs.
 * Every fixture satisfies its corresponding `components['schemas'][…]` shape.
 */
import type {
  DeviceRecord, IImageAttachment, PaginatedDevices,
  ArticleResponse, PaginatedArticles,
  CloudinaryImage, ImageObj,
} from '../types';
import type { DeviceCategoryRecord, DeviceCategoryListResponse } from '../device-category';

// ── Cloudinary / Image primitives ──

export function makeCloudinaryImage(overrides: Partial<CloudinaryImage> = {}): CloudinaryImage {
  return {
    public_id: 'img/test',
    version: 1,
    signature: 'sig',
    width: 800,
    height: 600,
    format: 'jpg',
    resource_type: 'image',
    url: 'http://res.cloudinary.com/test/image/upload/v1/img/test.jpg',
    secure_url: 'https://res.cloudinary.com/test/image/upload/v1/img/test.jpg',
    original_filename: 'test',
    ...overrides,
  };
}

export function makeImageObj(overrides: Partial<ImageObj> = {}): ImageObj {
  return {
    original: makeCloudinaryImage(),
    ...overrides,
  };
}

export function makeImageAttachment(overrides: Partial<IImageAttachment> = {}): IImageAttachment {
  return {
    id: 'img-1',
    imageJson: makeImageObj(),
    order: 0,
    ...overrides,
  };
}

// ── Devices ──

export function makeDevice(overrides: Partial<DeviceRecord> = {}): DeviceRecord {
  return {
    id: 'dev-1',
    type: 'washing_machine',
    name: 'ASKO W6098X',
    model: 'W6098X',
    brand: 'ASKO',
    slug: 'asko-w6098x',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makePaginatedDevices(overrides: Partial<PaginatedDevices> = {}): PaginatedDevices {
  return {
    data: [makeDevice()],
    overallCount: 1,
    page: 1,
    limit: 12,
    ...overrides,
  };
}

// ── Articles ──

export function makeArticle(overrides: Partial<ArticleResponse> = {}): ArticleResponse {
  return {
    id: 'art-1',
    title: 'Уход за стиральной машиной',
    slug: 'uhod-za-stiralnoj-mashinoj',
    text: 'Текст статьи',
    viewCount: 42,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makePaginatedArticles(overrides: Partial<PaginatedArticles> = {}): PaginatedArticles {
  return {
    data: [makeArticle()],
    overallCount: 1,
    page: 1,
    limit: 10,
    ...overrides,
  };
}

// ── Device Categories ──

export function makeDeviceCategory(overrides: Partial<DeviceCategoryRecord> = {}): DeviceCategoryRecord {
  return {
    id: 'cat-1',
    name: 'washing_machine',
    label: 'Стиральная машина',
    labelPlural: 'Стиральные машины',
    order: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeCategoryListResponse(
  categories = [makeDeviceCategory()],
): DeviceCategoryListResponse {
  return { categories };
}
