import type { FlashNews, FlashNewsRequest, NotificationResponse, PageResponse } from "@/features/notification/types";
import api from "@/services/apiClient";


export const notificationService = {
  getNotifications: async (employeeId: string, page = 0, size = 10): Promise<PageResponse<NotificationResponse>> => {
    const response = await api.get(`/v1/notifications/user/${employeeId}`, {
      params: { page, size }
    });
    return response.data;
  },

  getUnreadNotificationsCount: async (employeeId: string): Promise<number> => {
    const response = await api.get(`/v1/notifications/user/${employeeId}/unread-count`);
    return response.data;
  },


  markAsRead: async (notificationId: number): Promise<void> => {
    await api.patch(`/v1/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await api.post(`/v1/notifications/user/${userId}/mark-all-read`);
  },

  createFlashNews: async (data: FlashNewsRequest) => {
    try {
      const message = await api.post("/v1/flash-news", data);
      return message.data;
    }
    catch (error: any) {
      throw error.response?.data?.message || "Failed to post the news"
    }
  },
  getFlashNews: async (): Promise<FlashNews[]> => {
    const response = await api.get('/v1/flash-news');
    
    return response.data;
  },



}