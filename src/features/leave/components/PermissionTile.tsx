import { CTAButton, Divider } from '@/shared/components';
import React from 'react';
import { HiDotsCircleHorizontal } from 'react-icons/hi';
import { HiOutlineClock } from 'react-icons/hi2';

export interface PermissionTileProps {
    employeeName: string;
    permissionDate: string;
    startTime: string;
    endTime: string;
    durationFormatted: string;
    reason: string;
    createdAt: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    onAccept?: () => void;
    onReject?: () => void;
}

const PermissionTile: React.FC<PermissionTileProps> = ({
    employeeName,
    permissionDate,
    startTime,
    endTime,
    durationFormatted,
    reason,
    createdAt,
    status = 'PENDING',
    onAccept,
    onReject,
}) => {
    return (
        <div className='bg-white w-full rounded-sm flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 md:gap-4 border border-slate-100 shadow-sm hover:border-slate-300 transition-all'>

            {/* 1. Identity — identical structure to RequestTile */}
            <div className='flex items-start gap-3 min-w-fit'>
                <HiDotsCircleHorizontal
                    size={35}
                    className="text-slate-300 shrink-0 mt-0.5"
                />
                <div className='flex flex-col'>
                    <span className='uppercase font-black text-[11px] md:text-xs tracking-wider text-slate-700 leading-tight'>
                        {employeeName}
                    </span>
                    <span className='text-violet-500 font-bold text-[10px] uppercase tracking-tighter mt-0.5'>
                        Permission
                    </span>
                </div>
            </div>

            <div className="hidden md:block"><Divider /></div>

            {/* 2. Date & Duration — mirrors RequestTile exactly:
                  Line 1: date (same as "May 14 - May 15")
                  Line 2: duration badge (same style as "1 DAY" badge)
                  Line 3: time-range badge (same style as "PARTIAL DAYS" badge) */}
            <div className='hidden md:flex flex-col items-center min-w-[140px] px-2 text-center gap-0.5'>
                <span className='text-[11px] font-bold text-slate-600'>
                    {permissionDate}
                </span>
                {/* Duration — same amber badge style as "1 DAY" */}
                <span className='text-[10px] font-black text-amber-500 uppercase'>
                    {durationFormatted}
                </span>
                {/* Time range — same muted badge style as "PARTIAL DAYS" */}
                <span className='text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1'>
                    <HiOutlineClock size={9} />
                    {startTime} – {endTime}
                </span>
            </div>

            {/* Mobile: date + time inline */}
            <div className='md:hidden flex items-center gap-2 text-[11px] text-slate-600 font-bold'>
                <span>{permissionDate}</span>
                <span className='text-slate-300'>•</span>
                <span className='text-amber-500 font-black'>{durationFormatted}</span>
                <span className='text-slate-300'>•</span>
                <span className='text-slate-500 flex items-center gap-0.5'>
                    <HiOutlineClock size={10} />
                    {startTime} – {endTime}
                </span>
            </div>

            <div className="hidden md:block"><Divider /></div>

            {/* 3. Reason — identical to RequestTile */}
            <div className='flex-1 min-w-0 hidden lg:block'>
                <p className='text-[11px] text-slate-500 line-clamp-1 italic'>
                    "{reason}"
                </p>
            </div>

            <div className="hidden lg:block"><Divider /></div>

            {/* 4. Actions — exact same CTAButton as RequestTile */}
            <div className='flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto'>
                {status === 'PENDING' ? (
                    <div className='flex flex-1 md:flex-none gap-2'>
                        {onAccept && (
                            <CTAButton
                                label='Accept'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAccept();
                                }}
                            />
                        )}
                        {onReject && (
                            <CTAButton
                                label='Reject'
                                isOutlineOnly
                                className='border-red-500 text-red-400'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject();
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div className={`flex-1 md:flex-none px-6 py-2 rounded-sm border font-black text-[10px] uppercase tracking-widest text-center min-w-[120px] ${
                        status === 'APPROVED'
                            ? 'bg-green-50 border-green-200 text-green-600'
                            : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                        {status}
                    </div>
                )}
            </div>

            {/* 5. Timestamp — identical to RequestTile */}
            <div className='flex justify-between items-center md:flex-col md:justify-center border-t border-slate-50 md:border-none pt-2 md:pt-0'>
                <span className='md:hidden text-[9px] font-bold text-slate-300 uppercase'>
                    Requested
                </span>
                <span className='text-slate-400 text-[9px] md:text-[10px] font-medium whitespace-nowrap'>
                    {createdAt}
                </span>
            </div>

        </div>
    );
};

export default PermissionTile;