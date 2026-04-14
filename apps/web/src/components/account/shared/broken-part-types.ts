export interface BrokenPart {
  id: string;
  name: string;
  note?: string;
  status: string;
  isSuggestion?: boolean;
  devicePartId?: string;
  externalOrderId?: string;
  supplierProvider?: string;
  orderedAt?: string | Date;
}

export interface BrokenPartImage {
  id?: string;
  url?: string;
  image?: {
    thumbnail?: { secure_url?: string };
    small?: { secure_url?: string };
    original?: { secure_url?: string };
  };
}

export interface BrokenPartDocument {
  id: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
}

export interface RepairRequestDocument {
  id: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
}
