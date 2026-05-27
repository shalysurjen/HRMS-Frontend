import NotificationDetailDrawer from "@/features/notification/components/NotificationDetailDrawer";
import NotificationTile from "@/features/notification/components/NotificationTile";
import { useNotifications } from "@/features/notification/hooks/useNotification";
import type { NotificationResponse } from "@/features/notification/types";
import { useAuth } from "@/shared/auth/useAuth";
import { MetricTile, CustomLoader } from "@/shared/components";
import { formatTimeAgo } from "@/shared/utils/formatTimeAgo";
import React, { useState, useMemo } from "react";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { RiCheckDoubleFill } from "react-icons/ri";


const NotificationsView: React.FC = () => {
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    notifications,
    isLoading,
    error,
    pageInfo,
    refetch,
    unreadCount,
    markAllAsRead,
    markAsRead
  } = useNotifications(user?.id!);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const aUnread = a.notificationStatus !== 'READ';
      const bUnread = b.notificationStatus !== 'READ';

      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  const displayNotifications = useMemo(() => {
    return sortedNotifications.filter(n =>
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.eventType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedNotifications, searchQuery]);

  const handlePageChange = (newPageIndex: number) => {
    setCurrentPage(newPageIndex);
    refetch(newPageIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNotificationClick = async (n: NotificationResponse) => {
    setSelectedNotification(n);
    setIsDrawerOpen(true);

    if (n.notificationStatus !== 'READ') {
      await markAsRead(n.id);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllAsRead(user.id);

  }

  return (
    <div className="flex flex-col gap-4">
      <div className='min-h-24 py-6 w-full flex flex-col md:flex-row justify-between items-center bg-[#F1F5F9] px-6 rounded-sm border border-slate-200 gap-6 md:gap-0'>
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight">
            Welcome back, <span className="text-primary-500">{user?.name || "User"}</span>
          </h2>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Check out what's going on in your notification center
          </p>
        </div>

        <div className="shrink-0">
          <MetricTile
            value={unreadCount.toString().padStart(2, '0')}
            firstLabel="New"
            secondLabel="Notifications"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F1F5F9] border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => handleMarkAllRead()}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-sm hover:bg-slate-50 transition-all flex-1 md:flex-none flex justify-center"
            title="Mark all as read"
          >
            <RiCheckDoubleFill size={18} />
          </button>

        </div>
      </div>

      {/* List Section */}
      <div className='flex flex-col bg-[#F1F5F9] rounded-sm border border-slate-200 overflow-hidden min-h-[400px]'>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <CustomLoader label="Syncing Notifications..." />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-500 text-xs font-bold uppercase">{error}</div>
        ) : displayNotifications.length > 0 ? (
          <>
            <div className="flex-1">
              {displayNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="cursor-pointer active:bg-slate-100 transition-colors"
                >
                  <NotificationTile
                    eventType={n.eventType}
                    message={n.message}
                    createdAt={formatTimeAgo(n.createdAt)}
                    isUnread={n.notificationStatus !== 'READ'}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {currentPage + 1} of {pageInfo.totalPages} ({pageInfo.totalElements} Total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2 border border-slate-200 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <FaChevronLeft size={10} className="text-slate-600" />
                </button>
                <button
                  disabled={currentPage >= pageInfo.totalPages - 1}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 border border-slate-200 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <FaChevronRight size={10} className="text-slate-600" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center uppercase text-[10px] font-black text-slate-400 tracking-widest">
            {searchQuery ? "No matching notifications" : "No notifications found"}
          </div>
        )}
      </div>

      <NotificationDetailDrawer
        notification={selectedNotification}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default NotificationsView;