import React from 'react';
import { FaCheckCircle, FaRegClock, FaTimesCircle, FaBell } from 'react-icons/fa';

interface NotificationTileProps {
    eventType: string;
    message: string;
    createdAt: string;
    isUnread: boolean;
}

const NotificationTile: React.FC<NotificationTileProps> = ({
    eventType,
    message,
    createdAt,
    isUnread
}) => {
    const getIconTheme = (type: string) => {
        switch (type) {
            case "LEAVE_APPROVED": return { icon: <FaCheckCircle />, color: "text-emerald-500" };
            case "LEAVE_APPLIED": return { icon: <FaRegClock />, color: "text-amber-500" };
            case "LEAVE_REJECTED": return { icon: <FaTimesCircle />, color: "text-rose-500" };
            default: return { icon: <FaBell />, color: "text-indigo-500" };
        }
    };

    const theme = getIconTheme(eventType);

    return (
        <div className={`w-full p-4 flex items-center justify-between border-b rounded-sm border-slate-100 last:border-0 hover:bg-slate-50 transition-all duration-200 ${isUnread ? 'bg-indigo-50/40' : 'bg-white'
            }`}>
            <div className="flex items-center gap-4 min-w-0">
                {/* ICON & UNREAD DOT CONTAINER */}
                <div className="relative shrink-0 flex items-center justify-center w-10 h-10 bg-slate-50 rounded-lg">
                    <div className={`${theme.color} text-xl`}>
                        {theme.icon}
                    </div>

                    {/* THE DOT: Positioned absolutely relative to the icon container */}
                    {isUnread && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            {/* Outer Pulse Effect */}
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            {/* Inner Solid Dot */}
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600 border-2 border-white"></span>
                        </span>
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <span className={`uppercase font-black text-[10px] md:text-[11px] tracking-wider ${isUnread ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                        {eventType.replace(/_/g, ' ')}
                    </span>
                    <p className={`text-xs line-clamp-1 mt-0.5 ${isUnread ? 'text-slate-700 font-bold' : 'text-slate-500 font-medium'
                        }`}>
                        {message}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap   uppercase tracking-tighter">
                    {createdAt}
                </span>
                {/* Small text indicator for accessibility */}
                {isUnread && (
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">New</span>
                )}
            </div>
        </div>
    );
};

export default NotificationTile;