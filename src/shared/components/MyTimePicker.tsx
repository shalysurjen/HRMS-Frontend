import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { HiOutlineClock } from "react-icons/hi2"; 
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker/datepicker-overrides.css"; 

interface TimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string }>(
  ({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 bg-slate-50 text-left outline-none focus:border-indigo-600 transition-all group rounded-sm"
    >
      <span className={`${value ? "text-slate-900" : "text-slate-400"} text-xs font-black uppercase tracking-tight`}>
        {value || placeholder}
      </span>
      <HiOutlineClock className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={16} />
    </button>
  )
);

const MyTimePicker: React.FC<TimePickerProps> = ({
  selected,
  onChange,
  placeholder = "SELECT TIME",
  label,
  required,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-[0.15em]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15} // Sets steps to 15 mins (00, 15, 30, 45)
        timeCaption="Time"
        dateFormat="h:mm aa" // Shows as 05:30 PM
        customInput={<CustomInput placeholder={placeholder} />}
        portalId="datepicker-portal"
        showPopperArrow={false}
        popperPlacement="bottom-start"
        autoComplete="off"
      />
    </div>
  );
};

export default MyTimePicker;