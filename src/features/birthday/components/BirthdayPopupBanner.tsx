import { useEffect, useState } from "react";
import { useAuth } from "@/shared/auth/useAuth";

const BirthdayPopupBanner = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.dateOfBirth) return;
    const dob = new Date(user.dateOfBirth);
    const today = new Date();
    const isBirthday =
      dob.getMonth() === today.getMonth() &&
      dob.getDate() === today.getDate();
    if (!isBirthday) return;
     
  const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    
  };

  if (!show || dismissed) return null;

  const firstName = user?.name?.split(" ")[0] || "Friend";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: "5%",  color: "#FFD700", dur: "2.8s", delay: "0s" },
          { left: "14%", color: "#FF6B9D", dur: "3.2s", delay: "0.3s", w: "6px", h: "11px" },
          { left: "24%", color: "#4ECDC4", dur: "2.5s", delay: "0.7s" },
          { left: "36%", color: "#FFD700", dur: "3.5s", delay: "0.1s", w: "10px", h: "6px" },
          { left: "49%", color: "#A78BFA", dur: "2.9s", delay: "0.5s" },
          { left: "62%", color: "#FF6B9D", dur: "3.1s", delay: "0.9s", w: "6px", h: "12px" },
          { left: "74%", color: "#4ECDC4", dur: "2.7s", delay: "0.2s" },
          { left: "84%", color: "#FFD700", dur: "3.3s", delay: "0.6s" },
          { left: "92%", color: "#A78BFA", dur: "2.6s", delay: "0.4s", w: "10px", h: "6px" },
          { left: "10%", color: "#4ECDC4", dur: "3.0s", delay: "1.1s" },
          { left: "44%", color: "#FF6B9D", dur: "2.4s", delay: "0.8s" },
          { left: "70%", color: "#FFD700", dur: "3.4s", delay: "0.3s", w: "6px", h: "10px" },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: c.left,
              width: c.w ?? "8px",
              height: c.h ?? "8px",
              background: c.color,
              animation: `confettiFall ${c.dur} ${c.delay} linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Popup card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "popIn 0.3s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        {/* Dark header */}
        <div
          className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
          style={{ background: "#1a1a2e" }}
        >
          <span className="absolute text-5xl opacity-10 -left-4 top-2">✦</span>
          <span className="absolute text-4xl opacity-10 -right-2 bottom-1">✦</span>

          <div className="flex justify-center items-end gap-4 mb-3">
            <span style={{ fontSize: 34, animation: "float1 3s ease-in-out infinite", display: "inline-block" }}>🎈</span>
            <span style={{ fontSize: 42, animation: "float2 2.4s ease-in-out infinite 0.4s", display: "inline-block" }}>🎂</span>
            <span style={{ fontSize: 34, animation: "float1 2.8s ease-in-out infinite 0.8s", display: "inline-block" }}>🎈</span>
          </div>

          <h2 className="text-white text-xl font-bold tracking-wide">Happy Birthday!</h2>
          <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: "#A78BFA" }}>
            Today is your special day
          </p>

          <div className="flex justify-center gap-2 mt-4">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#C4B5FD" }}
            >
              🎉 Celebrate
            </span>
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(78,205,196,0.15)", border: "1px solid rgba(78,205,196,0.35)", color: "#5eead4" }}
            >
              ✨ Sparkle
            </span>
          </div>
        </div>

        {/* Emoji strip */}
        <div className="flex justify-around px-5 py-2.5 border-b" style={{ background: "#f8f7ff", borderColor: "#ede9fe" }}>
          {["🎁", "🎊", "🌟", "🎊", "🎁"].map((e, i) => (
            <span key={i} style={{ fontSize: 18 }}>{e}</span>
          ))}
        </div>

        {/* Body */}
        <div className="bg-white px-6 pt-5 pb-4">
          <p className="font-bold text-sm mb-2" style={{ color: "#1a1a2e" }}>Dear {firstName},</p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "#64748b" }}>
            Wishing you a truly wonderful birthday! Your energy and dedication light up our workplace every single day.
          </p>

          <div
            className="mb-5 px-4 py-3"
            style={{
              background: "#f8f7ff",
              borderLeft: "3px solid #A78BFA",
              borderRadius: "0 10px 10px 0",
            }}
          >
            <p className="text-xs italic leading-relaxed m-0" style={{ color: "#7c3aed" }}>
              "May this year bring you everything you've been working toward and more!"
            </p>
          </div>

          <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>With warm wishes,</p>
          <p className="text-xs font-bold" style={{ color: "#1a1a2e" }}>Team HR, WeNxt Technologies</p>
        </div>

        {/* Button */}
        <div className="bg-white px-6 pb-6">
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide border-none cursor-pointer"
            style={{ background: "#1a1a2e" }}
          >
            Thank you! 🎂
          </button>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes confettiFall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BirthdayPopupBanner;