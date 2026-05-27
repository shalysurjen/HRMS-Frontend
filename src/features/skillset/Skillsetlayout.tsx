import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";

const SkillsetLayout: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role !== "EMPLOYEE";

  const tabs = [
    { label: "Home", path: "home" },
    { label: "My Skills", path: "my-skills" },
    { label: "Badges", path: "badges" },
    { label: "Progression", path: "progression" },
    ...(isManager ? [{ label: "Team Skills", path: "team-skills" }] : []),
  ];
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3 flex-wrap border-b border-slate-200 pb-3 mb-5">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SkillsetLayout;