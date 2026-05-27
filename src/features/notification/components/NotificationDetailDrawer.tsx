import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaRegClock, FaInfoCircle } from 'react-icons/fa';
import type { NotificationResponse } from '@/features/notification/types';

interface DrawerProps {
  notification: NotificationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDetailDrawer: React.FC<DrawerProps> = ({ notification, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && notification && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          {/* Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <FaInfoCircle className="text-indigo-500" /> Details
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <FaTimes className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                <p className="text-sm font-bold text-indigo-600 uppercase  ">
                  {notification.eventType.replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                <p className="text-slate-700 leading-relaxed font-medium mt-1">
                  {notification.message}
                </p>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <FaRegClock size={12} />
                <span className="text-xs font-bold  ">{new Date(notification.createdAt).toLocaleString()}</span>
              </div>

              {/* <div className="mt-10 pt-6 border-t border-slate-100">
                 <button className="w-full py-3 bg-slate-800 text-white rounded-sm text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
                    Acknowledge
                 </button>
              </div> */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDetailDrawer;