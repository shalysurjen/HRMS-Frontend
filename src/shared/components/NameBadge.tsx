const Badge = ({ label, active }: { label: string; active: boolean }) => (
    <span className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${active
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : "bg-slate-50 text-slate-400 border-slate-100"
        }`}>
        {label}
    </span>
);

export default Badge;