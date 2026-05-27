import { useFlashNews } from "@/features/notification/hooks/useFlashNews";
import type { FlashNewsRequest } from "@/features/notification/types";
import React, { useState } from "react";

// interface Props {
//   onSubmit?: (data: FlashNewsRequest) => Promise<boolean>;
// }

const FlashNewsForm = () => {


  const { createFlashNewsController } = useFlashNews();
  const [formData, setFormData] = useState<FlashNewsRequest>({
    message: "",
    days: 1,
    priority: 1,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "">("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "message" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const success = await createFlashNewsController(formData);

    if (success) {
      setStatus("success");
      setFormData({ message: "", days: 1, priority: 1 });
    } else {
      setStatus("error");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center bg-slate-50 p-4 sm:p-6 lg:p-12 w-full">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 lg:p-10">


        {/* Header Section */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Flash News
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast important updates to your users across the platform.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Message Field */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
              Announcement Message
            </label>
            <div className="relative">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none outline-none"
                placeholder="What do you want to tell your users?"
              />
            </div>
          </div>

          {/* Row for Days and Priority */}
          <div className="grid grid-cols-2 gap-5">

            {/* Days Field */}
            <div className="space-y-2">
              <label htmlFor="days" className="block text-sm font-semibold text-slate-700">
                Active Days
              </label>
              <div className="relative">
                <input
                  id="days"
                  type="number"
                  name="days"
                  value={formData.days}
                  onChange={handleChange}
                  min={1}
                  required
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>

            {/* Priority Field */}
            <div className="space-y-2">
              <label htmlFor="priority" className="block text-sm font-semibold text-slate-700">
                Priority Level
              </label>
              <div className="relative">
                <input
                  id="priority"
                  type="number"
                  name="priority"
                  value={formData.priority || ""}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="e.g. 1"
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {status === "success" && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
              <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Flash news created successfully.
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-100 animate-in fade-in slide-in-from-bottom-2">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Failed to create flash news. Please try again.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm shadow-indigo-200 mt-2"
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <span>Publish Announcement</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FlashNewsForm;
