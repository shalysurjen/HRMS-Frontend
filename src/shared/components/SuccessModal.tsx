import { motion } from "framer-motion";

interface LoaderProps {
  message?: string;
  onClick? : () => void
}

const Loader: React.FC<LoaderProps> = ({ message = "Signing you in..."  }) => {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-8">

      {/* Modern Circular Loader */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1.4,
          ease: "linear",
        }}
        className="relative w-16 h-16"
      >
        {/* faint base ring */}
        <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />

        {/* animated arc */}
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
          border-t-primary-500
          border-r-primary-400
          shadow-[0_0_8px_rgba(99,102,241,0.5)]
        "
        />
      </motion.div>

      {/* Message */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="text-sm font-medium text-neutral-600 tracking-wide"
      >
        {message}
      </motion.p>

    </div>
  );
};

export default Loader;