import { useEffect, useState } from "react";
import { birthdayService } from "../services/birthdayService";

interface Props {
  onClick: () => void;
  isOpen: boolean;
}

const BirthdayTopbarButton = ({ onClick, isOpen }: Props) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    birthdayService.getTodayBirthdays()
      .then(data => setCount(data.length))
      .catch(() => setCount(0));
  }, []);

  // ✅ FIX: Always show the button — hide only if API explicitly returns 0
  // count === 0 இருந்தாலும் button காட்டு, just badge hide ஆகும்

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[6px] border rounded-[8px] px-3 py-[6px] cursor-pointer transition-all
        ${isOpen
          ? "bg-[#F4C0D1] border-[#D4537E]"
          : "bg-[#FBEAF0] border-[#F4C0D1] hover:bg-[#F4C0D1]"
        }`}
    >
      <span className="text-[13px]">🎂</span>
      <span className="text-[11px] font-semibold text-[#72243E]">Birthdays</span>
      {count > 0 && (
        <span className="text-[9px] bg-[#D4537E] text-white rounded-full px-[6px] py-[1px] font-semibold">
          {count}
        </span>
      )}
    </button>
  );
};

export default BirthdayTopbarButton;
