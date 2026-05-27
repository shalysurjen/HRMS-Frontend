import React from "react";
import { FaPlaneDeparture, FaRegCalendarAlt, FaClock, FaUsers, FaCheck } from "react-icons/fa";

interface ManagerStatCardProps {
    label: string;
    value: string | number;
    total?: number; 
    iconType: 'leave' | 'calendar' | 'pending' | 'team' | 'processed';
    colorClass?: string;
    strokeColor?: string; 
    onClick?: () => void;
}

const ManagerStatCard: React.FC<ManagerStatCardProps> = ({
    label,
    value,
    total,
    iconType,
    colorClass = "text-slate-900",
    strokeColor = "#6366f1",
    onClick
}) => {
    const icons = {
        leave: <FaPlaneDeparture />,
        calendar: <FaRegCalendarAlt />,
        pending: <FaClock />,
        team: <FaUsers />,
        processed: <FaCheck />
    };

    // Donut Logic
    const numericValue = typeof value === 'string' ? parseInt(value) : value;
    const percentage = total ? Math.min((numericValue / total) * 100, 100) : 0;

    // SVG Circle Math
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div
            onClick={onClick}
            className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-900 transition-all group cursor-pointer relative overflow-hidden active:scale-[0.98]"
        >
            {/* Left: Text Data */}
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500">
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${colorClass} tracking-tight   transition-transform group-hover:-translate-y-0.5`}>
                        {value}
                    </span>
                    {total && (
                        <span className="text-xs font-bold text-slate-300  ">/{total}</span>
                    )}
                </div>
                {total && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">
                        {Math.round(percentage)}% Utilized
                    </p>
                )}
            </div>

            {/* Right: Donut Chart Container */}
            <div className="relative flex items-center justify-center w-20 h-20">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s ease-out',
                            strokeLinecap: 'round'
                        }}
                    />
                </svg>

                {/* Center Icon */}
                <div className="absolute text-slate-200 group-hover:text-slate-400 transition-all duration-300 text-xl opacity-60 group-hover:scale-110">
                    {icons[iconType]}
                </div>
            </div>
        </div>
    );
};

export default ManagerStatCard;