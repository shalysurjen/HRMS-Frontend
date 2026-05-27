import type { LeaveType } from '@/features/leave/types';
import { CTAButton, Divider } from '@/shared/components';
import React from 'react';
import { FaFileImage } from 'react-icons/fa';
import { HiDotsCircleHorizontal } from 'react-icons/hi';

export interface RequestTileProps {
    employeeName: string;
    leaveType: LeaveType;
    dateRange: string;
    startDate: string;
    endDate: string;
    startDateHalfDayType?: "FIRST_HALF" | "SECOND_HALF" | string | null;
    endDateHalfDayType?: "FIRST_HALF" | "SECOND_HALF" | string | null;
    reasonMessage: string;
    days: number;
    createdAt: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string; // Added status prop
    onAccept?: () => void;
    onReject?: () => void;
    onDiscuss?: () => void;
    attachments?: any[];
    onViewAttachment?: (attachment: any) => void;
}

const RequestTile: React.FC<RequestTileProps> = ({
    employeeName,
    leaveType,
    dateRange,
    startDateHalfDayType,
    endDateHalfDayType,
    days,
    createdAt,
    status = 'PENDING', // Default to PENDING for safety
    onAccept,
    onReject,
    onDiscuss,
    attachments,
    onViewAttachment,
    reasonMessage
}) => {

    const getHalfDayLabel = (type?: string | null) => {
        if (type === "FIRST_HALF") return "Morning";
        if (type === "SECOND_HALF") return "Evening";
        return null;
    };

    const getDurationInfo = () => {
        const dayCount = days ?? 0;

        if (dayCount === 0.5) {
            const session = getHalfDayLabel(startDateHalfDayType || endDateHalfDayType);
            return {
                count: '0.5 Days',
                session: session
            };
        }

        const isMultiDayPartial = getHalfDayLabel(startDateHalfDayType) || getHalfDayLabel(endDateHalfDayType);

        return {
            count: dayCount === 1 ? '1 Day' : `${dayCount} Days`,
            session: isMultiDayPartial ? "Partial Days" : null
        };
    };

    const duration = getDurationInfo();
    const isOnDuty = leaveType === "ON_DUTY";

    return (
        <div className='bg-white w-full rounded-sm flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 md:gap-4 border border-slate-100 shadow-sm hover:border-slate-300 transition-all'>

            {/* 1. Identity Section */}
            <div className='flex items-start gap-3 min-w-fit'>
                <HiDotsCircleHorizontal size={35} className="text-slate-300 shrink-0 mt-0.5" />
                <div className='flex flex-col'>
                    <span className='uppercase font-black text-[11px] md:text-xs tracking-wider text-slate-700 leading-tight'>
                        {employeeName}
                    </span>
                    <div className='flex items-center gap-2 mt-0.5'>
                        <span className='text-indigo-600 font-bold text-[10px] uppercase tracking-tighter'>
                            {leaveType?.replace('_', ' ')}
                        </span>

                        {!isOnDuty && (
                            <span className='md:hidden text-amber-500 text-[10px] font-bold'>
                                • {duration.count} {duration.session && `(${duration.session})`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden md:block"><Divider /></div>

            {/* 2. Desktop Date & Days Section */}
            <div className='hidden md:flex flex-col items-center min-w-35 px-2 text-center'>
                <span className='text-[11px] font-bold text-slate-600'>{dateRange}</span>

                {!isOnDuty ? (
                    <div className='flex flex-col items-center mt-0.5'>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${days % 1 !== 0 ? 'text-amber-500' : 'text-indigo-400'}`}>
                            {duration.count}
                        </span>
                        {duration.session && (
                            <span className='text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded-full uppercase mt-0.5 border border-amber-100'>
                                {duration.session}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className='mt-0.5'>
                        <span className='text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded-full uppercase border border-blue-100'>
                            Duty
                        </span>
                    </div>
                )}
            </div>

            <div className="hidden md:block"><Divider /></div>

            {/* 3. Reason Section (Optional: Un-comment if you want to see the reason message) */}
            <div className='flex-1 min-w-0 hidden lg:block'>
                <p className='text-[11px] text-slate-500 line-clamp-1 italic'>
                    "{reasonMessage}"
                </p>
            </div>

            <div className="hidden lg:block"><Divider /></div>

            {/* 4. Status or Actions Section */}
            <div className='flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto'>
                {status === 'PENDING' ? (
                    <div className='flex flex-1 md:flex-none gap-2'>
                       

                        {onAccept && (
                            <CTAButton
                                label='Accept'
                                className="..."
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents parent card click
                                    onAccept();
                                }}
                            />
                        )}

                        {onReject && (
                            <CTAButton
                                label='Reject'
                                isOutlineOnly
                                className="... border-red-500 text-red-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject();
                                }}
                            />
                        )}

                        {onDiscuss && (
                            <CTAButton
                                label='Discuss'
                                isOutlineOnly
                                className="..."
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDiscuss();
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div className={`flex-1 md:flex-none px-6 py-2 rounded-sm border font-black text-[10px] uppercase tracking-widest text-center min-w-[120px] 
                        ${status === 'APPROVED'
                            ? 'bg-green-50 border-green-200 text-green-600'
                            : 'bg-red-50 border-red-200 text-red-600'}`}
                    >
                        {status}
                    </div>
                )}
            </div>

            {/* 5. Attachment Pill */}
            {attachments && attachments.length > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onViewAttachment?.(attachments[0]); }}
                    className="group flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-md transition-all border border-slate-200"
                    title="View Attachments"
                >
                    <FaFileImage size={14} className="opacity-70 group-hover:opacity-100" />
                    <span className="text-[10px] font-bold">
                        {attachments.length > 1 ? `(${attachments.length})` : 'FILE'}
                    </span>
                </button>
            )}

            {/* 6. Timestamp Footer */}
            <div className='flex justify-between items-center md:flex-col md:justify-center border-t border-slate-50 md:border-none pt-2 md:pt-0'>
                <span className='md:hidden text-[9px] font-bold text-slate-300 uppercase'>Requested</span>
                <span className='text-slate-400 text-[9px] md:text-[10px] font-medium whitespace-nowrap'>
                    {createdAt}
                </span>
            </div>
        </div>
    );
};

export default RequestTile;