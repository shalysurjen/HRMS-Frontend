import React from "react";
import { Tooltip, Zoom } from "@mui/material";
import { FaBolt } from "react-icons/fa";

interface MyFABProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  title?: string;
  tooltipLabel?: string;
}

const MyFloatingActionButton: React.FC<MyFABProps> = ({
  onClick,
  icon = <FaBolt />, 
  title,
  tooltipLabel = "New Action",
}) => {
  return (
    <Tooltip 
      title={tooltipLabel} 
      placement="left" 
      arrow 
      TransitionComponent={Zoom}
    >
      <button
        onClick={onClick}
        className={`
          /* Positioning & Z-Index */
          fixed bottom-8 right-8 z-[998]
          
          /* Flexbox & Alignment */
          flex items-center justify-center gap-2
          
          /* Colors & Typography */
          bg-primary-500 text-white
          font-bold text-[0.85rem] tracking-wide normal-case
          
          /* Shape & Sizing */
          ${title ? "px-6 py-3.5 rounded-xl" : "p-4 rounded-full"}
          
          /* Shadow (Industry standard colored shadow) */
          shadow-[0_10px_15px_-3px_rgba(99,102,241,0.3)]
          
          /* Transitions & Hover Effects */
          transition-all duration-200 ease-in-out
          hover:bg-[#4f46e5]
          hover:scale-105 hover:-translate-y-1
          hover:shadow-[0_20px_25px_-5px_rgba(99,102,241,0.4)]
          active:scale-95
        `}
      >
        <span className="text-sm">{icon}</span>
        {title && <span>{title}</span>}
      </button>
    </Tooltip>
  );
};

export default MyFloatingActionButton;