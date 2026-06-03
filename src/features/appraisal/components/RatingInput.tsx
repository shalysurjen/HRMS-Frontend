import { RATING_OPTIONS } from "@/features/appraisal/types/appraisal";

interface Props {
  value?: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  label?: string;
}

export const RatingInput = ({ value, onChange, readonly = false, label }: Props) => {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {RATING_OPTIONS.map((opt) => {
          const isSelected = value === opt;
          const isHalf = opt % 1 !== 0;
          return (
            <button
              key={opt}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onChange?.(opt)}
              className={`w-10 h-9 rounded-lg text-xs font-bold border transition-all
                ${isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                  : isHalf
                  ? "bg-indigo-50 border-indigo-100 text-indigo-400 hover:border-indigo-300"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                }
                ${readonly ? "cursor-default opacity-80" : "cursor-pointer"}
              `}
            >
              {opt % 1 === 0 ? opt : opt.toFixed(1)}
            </button>
          );
        })}
      </div>
      {value !== undefined && (
        <p className="text-xs text-slate-400">
          Selected: <span className="font-bold text-indigo-600">{value}</span> / 5.0
        </p>
      )}
    </div>
  );
};
