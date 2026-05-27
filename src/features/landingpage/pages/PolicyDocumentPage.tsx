import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPolicies, viewPolicy } from "../../dashboard/admin/services/policyService";
import logo from "@/assets/svg/logo.svg";

interface Policy {
  id: number;
  name: string;
  fileName: string;
}

// Returns only the latest version per policy name (highest id = newest)
const getLatestPolicies = (policies: Policy[]): Policy[] => {
  const map = new Map<string, Policy>();
  policies.forEach((p) => {
    const existing = map.get(p.name);
    if (!existing || p.id > existing.id) {
      map.set(p.name, p);
    }
  });
  return Array.from(map.values());
};

interface Props {
  title: string;
  filterKeyword: string; // e.g. "privacy", "terms", "leave"
}

const PolicyDocumentPage: React.FC<Props> = ({ title, filterKeyword }) => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPolicies();
        const filtered = (data || []).filter((p: Policy) =>
          p.name.toLowerCase().includes(filterKeyword.toLowerCase())
        );
        setPolicies(getLatestPolicies(filtered));
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filterKeyword]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="logo" className="h-10 w-10" />
            <span className="text-2xl font-black text-slate-800">
              Wenxt <span className="text-indigo-600">Technologies</span>
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">{title}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Click on a document to view it.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : policies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-4 text-slate-400 font-medium">
              No documents uploaded yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {policies.map((p) => (
              <li
                key={p.id}
                onClick={() => viewPolicy(p.id)}
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all group shadow-sm"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  <span className="text-xl">📄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {p.fileName}
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-indigo-400 transition-colors text-lg">
                  →
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <footer className="mt-12 bg-slate-100 p-6 rounded-3xl text-center border border-dashed border-slate-300">
          <p className="text-xs text-slate-500 italic">
            Confidential Notice: For Internal Circulation Only. Wenxt Technologies. All Rights Reserved.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PolicyDocumentPage;
