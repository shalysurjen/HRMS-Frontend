import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";

interface LoaderProps {
  message?: string;
  isFinished?: boolean;
  onFinished?: () => void;
}

const Loader: React.FC<LoaderProps> = ({ 
  message = "Processing...", 
  isFinished = false, 
  onFinished 
}) => {
  
  // When the parent marks 'isFinished' as true, trigger the callback
  useEffect(() => {
    if (isFinished && onFinished) {
      const timer = setTimeout(() => {
        onFinished();
      }, 800); // Small delay so the user feels the "completion"
      return () => clearTimeout(timer);
    }
  }, [isFinished, onFinished]);

  const loaderUI = (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-8">
      
      {/* Modern Circular Loader */}
      <motion.div
        animate={isFinished ? { scale: 0, opacity: 0 } : { rotate: 360 }}
        transition={{
          rotate: { repeat: Infinity, duration: 1.4, ease: "linear" },
          scale: { duration: 0.4, ease: "easeInOut" }
        }}
        className="relative w-16 h-16"
      >
        {/* Faint base ring */}
        <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />

        {/* Animated arc */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: "easeInOut",
          }}
          className="
            absolute inset-0 rounded-full
            border-2 border-transparent
            border-t-indigo-600
            border-r-indigo-400
            shadow-[0_0_8px_rgba(79,70,229,0.4)]
          "
        />
      </motion.div>

      {/* Message */}
      <motion.p
        animate={isFinished ? { y: 10, opacity: 0 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ 
          opacity: { repeat: isFinished ? 0 : Infinity, duration: 1.6 },
          y: { duration: 0.4 }
        }}
        className="text-xs font-black text-neutral-600 tracking-[0.2em] uppercase"
      >
        {isFinished ? "Success" : message}
      </motion.p>
    </div>
  );

  return ReactDOM.createPortal(loaderUI, document.body);
};

export default Loader;