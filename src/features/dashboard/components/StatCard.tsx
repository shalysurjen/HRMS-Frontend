import React, { useState, useEffect } from "react";
import { FaProcedures, FaPlaneDeparture, FaHome, FaRegCalendarAlt } from "react-icons/fa";

interface StatCardProps {
  title: string;
  used: number;
  total: number;
  color?: string;
  period?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  used,
  total,
  color = "indigo",
  period = "Cycle 2026",
  onClick
}) => {
  let percent = total > 0 ? Math.round((used / total) * 100) : 0;
  if (percent > 100) {
    percent = 100;
  }
  let daysLeft = total - used;

  if (daysLeft < 0) {
    daysLeft = 0;
  }

  const theme = {
    indigo: { text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", ring: "#4f46e5" },
    rose: { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", ring: "#e11d48" },
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", ring: "#059669" },
    amber: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", ring: "#d97706" },
    slate: { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", ring: "#475569" },
  }[color] || { text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", ring: "#4f46e5" };

  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const target = circumference - (Math.min(percent, 100) / 100) * circumference;
    setOffset(target);
  }, [percent, circumference]);

  const getIcon = () => {
    const t = title.toLowerCase();
    if (t.includes("sick")) return <FaProcedures />;
    if (t.includes("annual") || t.includes("yearly")) return <FaPlaneDeparture />;
    if (t.includes("home") || t.includes("wfh")) return <FaHome />;
    return <FaRegCalendarAlt />;
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:shadow-md hover:border-slate-400 transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${theme.bg} ${theme.text} flex items-center justify-center rounded-sm text-lg border ${theme.border}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">
              {title}
            </h4>
            <p className="text-[9px] font-bold text-slate-300 uppercase">{period}</p>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="none" />
            <circle
              cx={size / 2} cy={size / 2} r={radius} stroke={theme.ring} strokeWidth={strokeWidth} fill="none"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 1s ease-in-out" }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-black text-slate-900">{percent}%</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-slate-900 tracking-tighter  ">
            {daysLeft}
          </span>
          <div className="flex flex-col mb-1">
            <span className="text-[10px] font-black text-slate-900 uppercase leading-none">Days</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Available</span>
          </div>
        </div>

        <div className="text-right pb-1">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">{total}</span>
            <span className="text-gray-400 text-xs">remaining</span>

            <span className="text-lg font-bold">÷</span>

            <span className="text-xl font-bold">{used}</span>
            <span className="text-gray-400 text-xs">used</span>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300`} style={{ backgroundColor: theme.ring }} />
    </div>
  );
};

export default StatCard;