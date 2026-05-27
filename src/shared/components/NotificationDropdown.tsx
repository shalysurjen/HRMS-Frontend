import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCircle } from "react-icons/fa";

interface Notification {
  id: string | number;
  title: string;
  desc: string;
  unread: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  notifications,
  onMarkAllRead,
  onViewAll,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="
            fixed top-20 left-4 right-4 z-50
            sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3
            sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden
          "
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Updates
            </span>
            <button 
              onClick={onMarkAllRead}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Mark all read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 cursor-pointer ${
                    n.unread ? "bg-indigo-50/30" : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <FaCircle
                      className={`mt-1.5 w-1.5 h-1.5 shrink-0 ${
                        n.unread ? "text-indigo-500" : "text-slate-200"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${n.unread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-xs text-slate-400 font-medium">No new updates</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <button 
            onClick={onViewAll}
            className="w-full py-3 text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 transition-colors"
          >
            View All Notifications
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;