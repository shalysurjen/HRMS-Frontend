export interface FlashNewsRequest {
  message: string;
  days: number;
  priority?: number;
}

export interface FlashNews {
  id: number;
  priority: number;
  message: string;
  active: boolean;
  createdAt: string;
}