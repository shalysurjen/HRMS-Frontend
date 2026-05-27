import React from "react";
import { FaChevronRight } from "react-icons/fa";

interface ActivityCardProps {
  title: string;
  subtitle: string;
  label?: string; 
  statusText: string;
  statusType: "success" | "danger" | "warning" | "info";
  icon?: React.ReactNode;
  description?: string; 
  onClick?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  subtitle,
  label,
  statusText,
  statusType,
  icon,
  description,
  onClick,
}) => {
  const statusStyles = {
    success: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    danger: { pill: "bg-rose-50 text-rose-700 border-rose-200" },
    warning: { pill: "bg-amber-50 text-amber-700 border-amber-200" },
    info: { pill: "bg-blue-50 text-blue-700 border-blue-200" },
  };

  const activeStyle = statusStyles[statusType];

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50 cursor-pointer shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="text-slate-400 mt-0.5 shrink-0">
          {icon}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-[14px] tracking-tight">
              {title}
            </span>
            {label && (
              <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">
                {label}
              </span>
            )}
          </div>

          <div className="text-[12px] text-slate-500 font-medium">
            {subtitle}
          </div>

          {description && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 leading-normal">
              <span className="font-bold uppercase text-[9px] text-slate-400 mr-1.5">Note:</span>
              {description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 shrink-0">
        <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded border ${activeStyle.pill}`}>
          {statusText}
        </span>
        <FaChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </div>
  );
};

export default ActivityCard;