import { AnimatePresence, motion } from "framer-motion";

interface AnnouncementBarProps {
  onEditClick: () => void;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onEditClick }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-brand overflow-hidden relative z-40 shadow-lg shadow-brand/20 py-2.5 border-b border-white/10"
      >
        {/* TICKER CONTAINER */}
        <div className="flex whitespace-nowrap overflow-hidden group">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              duration: 25,
              ease: "linear",
            }}
            className="flex items-center gap-12 min-w-full"
          >
            {/* REPEATED CONTENT FOR SEAMLESS LOOP */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 text-white">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <p className="text-[11px] md:text-xs font-black tracking-[0.15em]">
                  IMPORTANT UPDATE:
                  <span className="opacity-90 font-medium ml-2">
                    Users can edit their profile details from
                    <span className="bg-white/20 px-2 py-0.5 rounded mx-1 text-white">06.04.2026</span>
                    to
                    <span className="bg-white/20 px-2 py-0.5 rounded mx-1 text-white">22.04.2026</span>.
                  </span>
                </p>
                <button
                  onClick={onEditClick}
                  className="bg-white text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase hover:bg-slate-100 transition-colors pointer-events-auto"
                >
                  Edit Now
                </button>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Shimmer Overlay */}
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBar;