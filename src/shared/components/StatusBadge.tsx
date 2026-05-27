import React from 'react';
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { HiExclamationCircle, HiInformationCircle } from 'react-icons/hi2';

type StatusType = 'APPROVED' | 'PENDING' | 'REJECTED' | 'AWAITING_ACTION';

interface StatusBadgeProps {
  status: StatusType | string;
}

const StatusBadge2: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status?.toUpperCase();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: <FiCheckCircle className="w-3.5 h-3.5" />,
          container: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: <FiXCircle className="w-3.5 h-3.5" />,
          container: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      case 'PENDING':
        return {
          label: 'Pending',
          icon: <HiInformationCircle className="w-3.5 h-3.5" />,
          container: 'bg-sky-50 border-sky-200 text-sky-700',
        };
      default:
        return {
          label: status || 'Awaiting Action',
          icon: <HiExclamationCircle className="w-3.5 h-3.5" />,
          container: 'bg-slate-50 border-slate-200 text-slate-600',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`
      inline-flex items-center gap-1.5 px-3 py-1 
      rounded-full border text-[11px] font-black uppercase tracking-tight
      ${config.container}
    `}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge2;