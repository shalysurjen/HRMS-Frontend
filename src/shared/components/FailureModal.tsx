import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";
import { HiOutlineX } from "react-icons/hi";

interface FailureModalProps {
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

const FailureModal: React.FC<FailureModalProps> = ({ 
  title, 
  message, 
  buttonText = "Try Again", 
  onClose 
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const modalUI = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden">
      {/* Backdrop with stronger blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md transition-all"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center border border-neutral-100"
      >
        {/* Subtle top close button for accessibility */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <HiOutlineX className="text-xl" />
        </button>

        <div className="pt-12 pb-10 px-8">
          {/* Main Error Icon with a "shake" animation on entry */}
          <motion.div
            animate={{ x: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner"
          >
            <FaExclamationTriangle />
          </motion.div>

          <h3 className="text-2xl font-black text-neutral-900 mb-3 tracking-tight">
            {title}
          </h3>
          
          <p className="text-neutral-500 text-sm font-medium mb-10 leading-relaxed">
            {message}
          </p>

          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-4 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-[0.96]"
            >
              {buttonText}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-transparent hover:bg-neutral-50 text-neutral-400 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Decorative bottom bar to match the "Rose" failure theme */}
        <div className="h-2 w-full bg-rose-500/10" />
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(modalUI, document.body);
};

export default FailureModal;