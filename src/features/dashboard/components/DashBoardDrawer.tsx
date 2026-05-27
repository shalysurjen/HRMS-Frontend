import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}
// const navigate = useNavigate();

const DashboardDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white  z-160 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900  ">{title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{subtitle}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-sm hover:bg-indigo-600 transition-colors">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {children}
            </div>
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


export default DashboardDrawer;