

import React from 'react'

export interface CTAButtonProps {
    label: string;
    className?: string;
    isOutlineOnly?: boolean;
    // Update this line to accept the event
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const CTAButton: React.FC<CTAButtonProps> = ({
    label,
    className = "",
    isOutlineOnly = false,
    onClick,
}) => {
    const baseStyles = "py-2 px-4 rounded transition-all font-medium h-8 flex items-center";
    const variantStyles = isOutlineOnly
        ? "border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50"
        : "bg-primary-500 text-white hover:bg-primary-600";

    return (
        <button 
            className={`${baseStyles} ${variantStyles} ${className}`} 
            onClick={onClick} // The event is now passed correctly
        >
            {label}
        </button>
    );
}

export default CTAButton;