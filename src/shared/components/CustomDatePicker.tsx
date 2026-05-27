import InputLabel from "@/shared/components/InputLabel";
import { format, isValid, parseISO } from "date-fns";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Basic styles
import { HiOutlineDocumentText } from "react-icons/hi2";

const CustomDatePicker = ({ value, onChange, label }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentYear = new Date().getFullYear();

    // Safely parse the value from your formData
    const selectedDate = value ? parseISO(value) : undefined;
    const isDateValid = selectedDate && isValid(selectedDate);

    // Helper to check if a date is within your allowed 1900-2026 range
    const isWithinRange = (date: Date) => {
        const year = date.getFullYear();
        return year >= 1900 && year <= 2026;
    };

    return (
        <div className="relative">
            <InputLabel>{label}</InputLabel>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                // UI logic remains identical
                className={`w-full border rounded-xl p-3 text-sm bg-white text-left flex justify-between items-center transition-all ${isDateValid && !isWithinRange(selectedDate) ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'
                    }`}
            >
                {/* Logic fix: Use isDateValid check to prevent formatting crashes */}
                {isDateValid ? format(selectedDate, "PPP") : "Select Date"}
                <HiOutlineDocumentText className="text-neutral-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 bg-white shadow-2xl border border-neutral-100 rounded-2xl p-4 animate-none fade-in zoom-in duration-100">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (date && isWithinRange(date)) {
                                onChange(format(date, "yyyy-MM-dd"));
                                setIsOpen(false);
                            }
                        }}
                        disabled={[
                            { after: new Date() },
                            { before: new Date("1900-01-01") }
                        ]}
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={currentYear}
                        // ADD THESE SPECIFIC CLASSES
                        classNames={{
                            caption_label: "hidden", // This removes the duplicate text label
                            dropdowns: "flex gap-2", // Aligns the interactive dropdowns neatly
                            dropdown: "bg-white border-none text-xs font-bold focus:ring-0 cursor-pointer"
                        }}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-4 py-2 text-[10px] font-black text-neutral-400 hover:text-indigo-600 uppercase tracking-widest"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;