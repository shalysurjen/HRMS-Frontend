import React from 'react';
import { FaFileImage, FaDownload, FaTimes, FaFileAlt } from 'react-icons/fa';
import AuthenticatedImage from './AuthenticatedImage';

interface AttachmentPreviewModalProps {
    attachment: any;
    onClose: () => void;
    onDownload: (attachment: any) => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({ attachment, onClose, onDownload }) => {
    if (!attachment) return null;

    const isImage = attachment.fileType?.includes('image') || 
                   ['jpg', 'jpeg', 'png'].some(ext => attachment.fileUrl?.toLowerCase().endsWith(ext));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative max-w-5xl w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            {isImage ? <FaFileImage size={18} /> : <FaFileAlt size={18} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 leading-none">{attachment.fileName}</h3>
                            <p className="text-xs text-slate-500 mt-1">Leave Application Attachment</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDownload(attachment)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
                        >
                            <FaDownload size={14} /> Download
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex justify-center items-center bg-gradient-to-b from-slate-50 to-slate-100 min-h-100 max-h-[80vh] overflow-auto">
                    {isImage ? (
                        <div className="relative group">
                            <AuthenticatedImage
                                fileUrl={attachment.fileUrl}
                                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl border-4 border-white"
                            />
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaFileAlt size={40} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Document Preview</h4>
                            <p className="text-slate-500 text-sm mb-6">We can't preview this file type directly, but you can download it to view.</p>
                            <button
                                onClick={() => onDownload(attachment)}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all"
                            >
                                Download File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};