import React from 'react'

export interface MetricTileProps {
    value: string;
    firstLabel: string;
    secondLabel: string; 
}

const MetricTile: React.FC<MetricTileProps> = ({
    value,
    firstLabel,
    secondLabel
}) => {
    return (
        <div className='flex gap-1 md:gap-2 items-center'>
            <span className='text-primary-500 font-bold text-4xl sm:text-5xl md:text-6xl leading-none'>
                {value}
            </span>
            
            <div className='flex flex-col'>
                <span className='text-black font-bold text-[10px] md:text-sm leading-tight uppercase'>
                    {firstLabel}
                </span>
                <span className='text-black font-bold text-[10px] md:text-sm leading-tight uppercase'>
                    {secondLabel}
                </span>
            </div>
        </div>
    )
}

export default MetricTile;