import loginAnimation from "@/assets/animations/login.json";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import React from "react";
import { FaArrowCircleLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-hidden flex flex-col selection:bg-brand selection:text-white">

      {/* ANNOUNCEMENT TICKER BAR */}
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-brand overflow-hidden relative z-60 shadow-lg shadow-brand/20 py-2.5 border-b border-white/10"
        >
          <div className="flex whitespace-nowrap overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                duration: 25,
                ease: "linear",
              }}
              className="flex items-center gap-12 min-w-[200%]"
            >
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
                    onClick={() => navigate("/login")}
                    className="bg-white text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase hover:bg-slate-100 transition-colors pointer-events-auto"
                  >
                    Login to Edit
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

      <div className="flex flex-row w-full flex-1">

        {/* LEFT SIDE: FORM PANEL */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className='w-full max-w-md'
          >
            <button
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-brand mb-8 transition-all duration-300"
            >
              <FaArrowCircleLeft className="text-2xl transition-transform group-hover:-translate-x-1" />
            </button>

            <LoginForm />
          </motion.div>
        </div>

        {/* RIGHT SIDE: GRAPHIC PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-brand-bg">

          {/* Background Blobs for consistency with Landing Page */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-120 h-120 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-100 h-100 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/20 to-brand/5" />

          {/* LOTTIE ANIMATION */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.71, 0.2, 1.01] }}
            className="relative z-10 flex items-center justify-center w-full max-w-112.5"
          >
            <Lottie
              animationData={loginAnimation}
              loop={true}
              autoplay={true}
            />
          </motion.div>

          {/* Footer Branding */}
          <div className="absolute bottom-8 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            © 2026 WENXT Technologies
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;