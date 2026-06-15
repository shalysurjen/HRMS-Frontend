// src/features/appraisal/pages/AppraisalEntryPage.tsx
//
// Entry screen for MANAGER / CTO / COO / ADMIN / HR roles.
// Shows the same cycle-selection UI as SelfAppraisalPage.
// On "Next" → navigates to /appraisal-reviews?cycleId=X

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppraisal } from "@/features/appraisal/hooks/useAppraisal";
import { HiOutlineDocumentText } from "react-icons/hi2";

const AppraisalEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cycles, loading, loadCycles } = useAppraisal();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  // Derive basePath: /manager, /employee, /hr, etc.
  const basePath = "/" + location.pathname.split("/")[1];

  useEffect(() => {
    loadCycles();
  }, []); // eslint-disable-line

  const handleNext = () => {
    if (!selectedCycleId) return;
    navigate(`${basePath}/appraisal-reviews?cycleId=${selectedCycleId}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Appraisal Reviews</h1>
      <p className="text-sm text-slate-400 mb-8">Select the appraisal year to begin</p>

      <div className="space-y-3 mb-8">
        {cycles.map((c) => {
          const isSelected = selectedCycleId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCycleId(c.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer
                ${isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${c.isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}
                >
                  <HiOutlineDocumentText size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">{c.cycleLabel}</p>
                  <p className="text-xs text-slate-400">
                    {c.isActive ? "Current Year" : "View Only"}
                  </p>
                </div>
              </div>
              {c.isActive && (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        disabled={!selectedCycleId || loading}
        onClick={handleNext}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "Loading..." : "Next →"}
      </button>
    </div>
  );
};

export default AppraisalEntryPage;