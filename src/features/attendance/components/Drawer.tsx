import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Drawer = ({ isOpen, onClose, title, children }: DrawerProps) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Organization View</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
          
          {/* Optional Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={onClose}
              className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;