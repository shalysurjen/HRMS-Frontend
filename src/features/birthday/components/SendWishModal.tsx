import { useState } from "react";
import type { BirthdayEmployee } from "../types/birthdayTypes";
import { birthdayService } from "../services/birthdayService";

interface Props {
  employee: BirthdayEmployee;
  currentUserId: string | null;
  onClose: () => void;
  onWishSent: (employeeId: string) => void;
}

const avatarColorMap: Record<string, string> = {};
const colors = [
  "bg-[#E6F1FB] text-[#0C447C]",
  "bg-[#E1F5EE] text-[#085041]",
  "bg-[#EEEDFE] text-[#3C3489]",
  "bg-[#FAEEDA] text-[#633806]",
];

const getAvatarColor = (id: string) => {
  const index = parseInt(id, 10) || 0;
  if (!avatarColorMap[id]) {
    avatarColorMap[id] = colors[index % colors.length];
  }
  return avatarColorMap[id];
};

const SendWishModal = ({ employee, currentUserId, onClose, onWishSent }: Props) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initials = `${employee.firstName[0]}${employee.lastName[0]}`;
  const avatarCls = getAvatarColor(employee.id);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please write a wish.");
      return;
    }
    if (!currentUserId) {
      setError("User not loaded. Please refresh.");
      return;
    }
    setLoading(true);
    try {
      await birthdayService.sendWish({
        birthdayEmployeeId: employee.id,
        wishedByEmployeeId: currentUserId,
        wishMessage: message.trim(),
      });
      onWishSent(employee.id);
      onClose();
    } catch {
      setError("Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-[360px] shadow-xl overflow-hidden">

        {/* Pink Header */}
        <div className="bg-pink-50 border-b border-pink-100 px-5 py-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarCls}`}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">
              {employee.firstName} {employee.lastName}
            </div>
            <div className="text-xs text-gray-400">
              {employee.employeeCode} · {employee.department}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">
            🎁 Write your birthday wish
          </p>
          <textarea
            className="w-full border border-pink-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            rows={4}
            placeholder="Type your birthday wish here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
          />
          <div className="text-[10px] text-gray-400 text-right mt-0.5">
            {message.length}/300
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Wish 🎉"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SendWishModal;