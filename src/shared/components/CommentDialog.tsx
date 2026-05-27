import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCommentDots, FaTimes } from "react-icons/fa";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  title: string;
  placeholder?: string;
  confirmLabel?: string;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = "Enter your notes here...",
  confirmLabel = "Confirm Action",
}) => {
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    if (!comment.trim()) return;
    onSubmit(comment);
    setComment(""); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-blue-50 flex items-center justify-center text-[#0061ff]">
                    <FaCommentDots />
                  </div>
                  <h3 className="font-bold text-slate-900 tracking-tight">{title}</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <FaTimes />
                </button>
              </div>

              <textarea
                autoFocus
                className="w-full min-h-30 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#0061ff] outline-none transition-all text-sm font-medium text-slate-700 resize-none"
                placeholder={placeholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={!comment.trim()}
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 rounded-sm bg-[#0061ff] text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-blue-200"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommentDialog;