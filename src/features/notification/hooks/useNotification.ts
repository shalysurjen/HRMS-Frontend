import type { FlashNews, NotificationResponse } from '@/features/notification/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = (employeeId?: string) => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [flashNews, setFlashNews]         = useState<FlashNews[]>([]);
  const [unreadCount, setUnreadCount]     = useState<number>(0);
  const [isLoading, setIsLoading]         = useState<boolean>(true);
  const [error, setError]                 = useState<string | null>(null);
  const [pageInfo, setPageInfo]           = useState({ totalElements: 0, totalPages: 0 });

  // FIX: guard against React StrictMode double-invoking useEffect in development,
  // which was causing two simultaneous fetch calls on mount.
  const initialFetchDone = useRef(false);

  const fetchNotifications = useCallback(async (page = 0, isPolling = false) => {
    if (!employeeId) return;

    try {
      if (!isPolling) setIsLoading(true);

      const [pageData, count] = await Promise.all([
        notificationService.getNotifications(employeeId, page),
        notificationService.getUnreadNotificationsCount(employeeId),
      ]);

      setNotifications(pageData.content);
      setUnreadCount(count);
      setPageInfo({
        totalElements: pageData.totalElements,
        totalPages:    pageData.totalPages,
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const fetchFlashNews = useCallback(async () => {
    try {
      const res = await notificationService.getFlashNews();
      setFlashNews(res);
      setError(null);
      return res;
    } catch (err) {
      setError('Failed to fetch FlashNews');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // --- Utility actions ---
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications(0, true);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async (employeeId: string) => {
    if (!employeeId) return;
    try {
      await notificationService.markAllAsRead(employeeId);
      await fetchNotifications(0, true);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    // FIX: skip the second mount that React StrictMode fires in development.
    // In production this ref is always false on first render so there is no impact.
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications(0, true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    pageInfo,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchFlashNews,
    flashNews,
  };
};