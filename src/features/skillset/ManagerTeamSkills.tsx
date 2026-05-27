import React, { useState, useEffect } from "react";
import { skillsetService } from "@/features/skillset/skillsetService";
// ── Types ──────────────────────────────────────────────────────────────────
export type SkillCategory = "Technical" | "Tools" | "Platforms" | "Interpersonal";

export interface Skill {
  skillName: string;
  category: SkillCategory;
  stars: number;
  certifiedDate?: string;
  learnedAt?: string;
  appliedAt?: string; 
  certLink?: string;
}

export interface Employee {
  empId: string;
  employeeName: string;
  department: string;
  joined: string;
  skills: Skill[];
}

// ── Map backend response to frontend Employee[] ───────────────────────────
function groupByEmployee(rawSkills: any[]): Employee[] {
  const map = new Map<string, Employee>();

  rawSkills.forEach((s) => {
    const empId: string = s.empId ?? "unknown";
    if (!map.has(empId)) {
      map.set(empId, {
        empId,
        employeeName: s.employeeName ?? "Unknown",
        department: s.department ?? "—",
        joined: "—", // backend doesn't return join year in this endpoint
        skills: [],
      });
    }

    // Map backend category enum → frontend category
    let category: SkillCategory = "Technical";
    const cat: string = s.category ?? "";
    if (cat === "TOOLS" || cat === "Tools & Platforms") category = "Tools";
    else if (cat === "INTERPERSONAL" || cat === "Interpersonal") category = "Interpersonal";

    map.get(empId)!.skills.push({
      skillName: s.skillName ?? s.name ?? "",
      category,
      stars: s.rating ?? s.stars ?? 0,
      certifiedDate: s.certDate ?? s.certifiedDate ?? undefined,
      learnedAt: s.learnedAt ?? s.learn ?? undefined,
      appliedAt: s.appliedAt ?? s.apply ?? undefined,
      certLink: s.certLink ?? s.proofFileUrl ?? s.file ?? undefined,
    });
  });

  return Array.from(map.values());
}

// ── Helpers ────────────────────────────────────────────────────────────────
const isToolsOrPlatforms = (cat: SkillCategory) => cat === "Tools" || cat === "Platforms";

const CATEGORIES = ["Employee", "Technical", "Tools & Platforms", "Interpersonal"] as const;
type Category = (typeof CATEGORIES)[number];

type SortOption = "proficiency_desc" | "proficiency_asc" | "date_asc" | "date_newest";

const AVATAR_PALETTE = [
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#FBEAF0", color: "#72243E" },
  { bg: "#EEEDFE", color: "#3C3489" },
];

const avatarStyle = (index: number) => AVATAR_PALETTE[index % AVATAR_PALETTE.length];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`text-sm leading-none ${i <= count ? "text-amber-400" : "text-slate-200"}`}
      >
        ★
      </span>
    ))}
  </span>
);

const CATEGORY_STYLES: Record<SkillCategory, string> = {
  Technical: "bg-blue-50 text-blue-800",
  Tools: "bg-teal-50 text-teal-800",
  Platforms: "bg-teal-50 text-teal-800",
  Interpersonal: "bg-pink-50 text-pink-800",
};

const CategoryBadge: React.FC<{ category: SkillCategory }> = ({ category }) => (
  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_STYLES[category]}`}>
    {isToolsOrPlatforms(category) ? "Tools & Platforms" : category}
  </span>
);

// ── Skill Group Detail ────────────────────────────────────────────────────
const SkillGroupDetail: React.FC<{
  skillName: string;
  entries: { emp: Employee; empIndex: number; skill: Skill }[];
  onBack: () => void;
}> = ({ skillName, entries, onBack }) => {
  const [selectedEntry, setSelectedEntry] = useState<{
    emp: Employee;
    empIndex: number;
    skill: Skill;
  } | null>(null);

  if (selectedEntry) {
    return (
      <SkillDetail
        skill={selectedEntry.skill}
        employee={selectedEntry.emp}
        empIndex={selectedEntry.empIndex}
        onBack={() => setSelectedEntry(null)}
      />
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-4 hover:opacity-75 transition-opacity"
      >
        ← Back
      </button>
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-4">
        <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800 text-base">{skillName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {entries.length} team member{entries.length !== 1 ? "s" : ""} know this skill
            </p>
          </div>
          <CategoryBadge category={entries[0].skill.category} />
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2">
        Team members
      </p>
      <div className="space-y-2">
        {entries.map(({ emp, empIndex, skill }, idx) => {
          const av = avatarStyle(empIndex);
          return (
            <button
              key={idx}
              onClick={() => setSelectedEntry({ emp, empIndex, skill })}
              className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white hover:border-indigo-300 transition-colors text-left"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: av.bg, color: av.color }}
              >
                {getInitials(emp.employeeName)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{emp.employeeName}</p>
                <p className="text-xs text-slate-400">{emp.department}</p>
              </div>
              <Stars count={skill.stars} />
              <span className="text-slate-300 text-xs">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Skill Detail ──────────────────────────────────────────────────────────
const SkillDetail: React.FC<{
  skill: Skill;
  employee: Employee;
  empIndex: number;
  onBack: () => void;
}> = ({ skill, employee, onBack }) => {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Employee", value: employee.employeeName },
    { label: "Department", value: employee.department },
    { label: "Rating", value: <Stars count={skill.stars} /> },
    { label: "Category", value: <CategoryBadge category={skill.category} /> },
    { label: "Certified on", value: skill.certifiedDate || "—" },
    { label: "Learned at", value: skill.learnedAt || "—" },
    { label: "Applied at", value: skill.appliedAt || "—" },
    {
      label: "Certificate",
      value: skill.certLink ? (
        <a
          href={skill.certLink}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 text-xs font-medium hover:underline"
        >
          View certificate ↗
        </a>
      ) : (
        <span className="text-slate-400 text-xs">Not uploaded</span>
      ),
    },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-4 hover:opacity-75 transition-opacity"
      >
        ← Back to {employee.employeeName}
      </button>
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800 text-base">{skill.skillName}</p>
            <div className="mt-1">
              <Stars count={skill.stars} />
            </div>
          </div>
          <CategoryBadge category={skill.category} />
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-4 px-4 py-3 text-sm">
              <span className="text-slate-400 w-32 shrink-0">{r.label}</span>
              <span className="text-slate-800">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Employee Detail ───────────────────────────────────────────────────────
const EmployeeDetail: React.FC<{
  employee: Employee;
  empIndex: number;
  filterCategory: Category;
  search: string;
  onBack: () => void;
  onSkillClick: (skill: Skill) => void;
}> = ({ employee, empIndex, filterCategory, search, onBack, onSkillClick }) => {
  const av = avatarStyle(empIndex);
  const q = search.toLowerCase();
  const filtered = employee.skills.filter((s) => {
    const catOk =
      filterCategory === "Employee" ||
      (filterCategory === "Tools & Platforms"
        ? isToolsOrPlatforms(s.category)
        : s.category === filterCategory);
    const qOk = !q || s.skillName.toLowerCase().includes(q);
    return catOk && qOk;
  });

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-4 hover:opacity-75 transition-opacity"
      >
        ← Back to team
      </button>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: av.bg, color: av.color }}
        >
          {getInitials(employee.employeeName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800">{employee.employeeName}</p>
          <p className="text-xs text-slate-500">
            {employee.department}
            {employee.joined !== "—" ? ` · Joined ${employee.joined}` : ""}
          </p>
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2">
        Skills
      </p>
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No skills match this filter.</p>
        )}
        {filtered.map((skill, idx) => (
          <button
            key={idx}
            onClick={() => onSkillClick(skill)}
            className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 bg-white hover:border-teal-300 transition-colors text-left"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{skill.skillName}</p>
              <div className="mt-0.5">
                <Stars count={skill.stars} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CategoryBadge category={skill.category} />
              <span className="text-slate-300 text-xs">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const ManagerTeamSkills: React.FC = () => {
  const [teamSkills, setTeamSkills] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Employee");
  const [sortBy, setSortBy] = useState<SortOption>("proficiency_desc");

  const [selectedEmp, setSelectedEmp] = useState<{ emp: Employee; index: number } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSkillGroup, setSelectedSkillGroup] = useState<string | null>(null);

  // ── Fetch team skills on mount ──────────────────────────────────────────
  useEffect(() => {
    skillsetService
      .getTeamSkills()
      .then(({ data }) => {
        setTeamSkills(groupByEmployee(data));
      })
      .catch(() => {
        setError("Failed to load team skills. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();

  if (loading) {
    return (
      <div className="text-center text-slate-400 text-sm py-16">Loading team skills...</div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 text-sm py-16">{error}</div>;
  }

  // ── Drill-down views ────────────────────────────────────────────────────
  if (selectedSkillGroup) {
    const entries: { emp: Employee; empIndex: number; skill: Skill }[] = [];
    teamSkills.forEach((emp, empIndex) => {
      emp.skills
        .filter((s) => s.skillName === selectedSkillGroup)
        .forEach((skill) => entries.push({ emp, empIndex, skill }));
    });
    return (
      <SkillGroupDetail
        skillName={selectedSkillGroup}
        entries={entries}
        onBack={() => setSelectedSkillGroup(null)}
      />
    );
  }

  if (selectedSkill && selectedEmp) {
    return (
      <SkillDetail
        skill={selectedSkill}
        employee={selectedEmp.emp}
        empIndex={selectedEmp.index}
        onBack={() => setSelectedSkill(null)}
      />
    );
  }

  if (selectedEmp) {
    return (
      <EmployeeDetail
        employee={selectedEmp.emp}
        empIndex={selectedEmp.index}
        filterCategory={category}
        search={search}
        onBack={() => setSelectedEmp(null)}
        onSkillClick={(skill) => setSelectedSkill(skill)}
      />
    );
  }

  // ── Skill group view (category tabs) ───────────────────────────────────
  const showSkillRows = category !== "Employee";

  type SkillGroup = {
    skillName: string;
    category: SkillCategory;
    avgStars: number;
    maxStars: number;
    entries: { emp: Employee; empIndex: number; skill: Skill }[];
    earliestTimestamp: number;
  };

  const buildSkillGroups = (): SkillGroup[] => {
    const map = new Map<string, SkillGroup>();
    teamSkills.forEach((emp, empIndex) => {
      emp.skills
        .filter((s) => {
          const catOk =
            category === "Tools & Platforms"
              ? isToolsOrPlatforms(s.category)
              : s.category === category;
          const qOk =
            !q ||
            s.skillName.toLowerCase().includes(q) ||
            emp.employeeName.toLowerCase().includes(q);
          return catOk && qOk;
        })
        .forEach((skill) => {
          if (!map.has(skill.skillName)) {
            map.set(skill.skillName, {
              skillName: skill.skillName,
              category: skill.category,
              avgStars: 0,
              maxStars: 0,
              entries: [],
              earliestTimestamp: Number.MAX_SAFE_INTEGER,
            });
          }
          const group = map.get(skill.skillName)!;
          group.entries.push({ emp, empIndex, skill });
          const parsedDate =
            skill.certifiedDate && skill.certifiedDate !== "—"
              ? new Date(skill.certifiedDate + " 1").getTime()
              : Number.MAX_SAFE_INTEGER;
          if (parsedDate < group.earliestTimestamp) {
            group.earliestTimestamp = parsedDate;
          }
        });
    });
    return Array.from(map.values()).map((group) => {
      const stars = group.entries.map((e) => e.skill.stars);
      group.avgStars = Math.round(stars.reduce((a, b) => a + b, 0) / stars.length);
      group.maxStars = Math.max(...stars);
      return group;
    });
  };

  const sortGroups = (groups: SkillGroup[]) => {
    return [...groups].sort((a, b) => {
      if (sortBy === "proficiency_desc") return b.avgStars - a.avgStars;
      if (sortBy === "proficiency_asc") return a.avgStars - b.avgStars;
      if (sortBy === "date_asc") return a.earliestTimestamp - b.earliestTimestamp;
      if (sortBy === "date_newest") return b.earliestTimestamp - a.earliestTimestamp;
      return 0;
    });
  };

  const skillGroups = showSkillRows ? sortGroups(buildSkillGroups()) : [];

  const filteredByEmp = teamSkills.filter((emp) => {
    const nameMatch = emp.employeeName.toLowerCase().includes(q);
    const skillMatch = emp.skills.some((s) => s.skillName.toLowerCase().includes(q));
    return nameMatch || skillMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Team skill overview</h2>
        <span className="text-xs text-slate-400">{teamSkills.length} members</span>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search employee or skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Category pills + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                category === cat
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {showSkillRows && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="proficiency_desc">Proficiency: High → Low</option>
            <option value="proficiency_asc">Proficiency: Low → High</option>
            <option value="date_newest">Date: Newest first</option>
            <option value="date_asc">Date: Oldest first</option>
          </select>
        )}
      </div>

      {/* Category skill rows */}
      {showSkillRows && (
        <>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            {category} · {skillGroups.length} {skillGroups.length === 1 ? "skill" : "skills"}
          </p>
          <div className="space-y-2">
            {skillGroups.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No skills found.</p>
            )}
            {skillGroups.map((group, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSkillGroup(group.skillName)}
                className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 bg-white hover:border-teal-300 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{group.skillName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {group.entries.length} {group.entries.length === 1 ? "person" : "people"} · avg{" "}
                    {group.avgStars}/5
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars count={group.avgStars} />
                  <span className="text-slate-300 text-xs">›</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Employee cards */}
      {!showSkillRows && (
        <div className="space-y-3">
          {filteredByEmp.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No results found.</p>
          )}
          {filteredByEmp.map((emp, empIndex) => {
            const av = avatarStyle(empIndex);
            const preview = emp.skills.slice(0, 3);
            return (
              <button
                key={empIndex}
                onClick={() => setSelectedEmp({ emp, index: empIndex })}
                className="w-full border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ background: av.bg, color: av.color }}
                  >
                    {getInitials(emp.employeeName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{emp.employeeName}</p>
                    <p className="text-xs text-slate-400">{emp.department}</p>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium shrink-0">
                    {emp.skills.length} skills →
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {preview.map((s, i) => (
                    <span
                      key={i}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_STYLES[s.category]}`}
                    >
                      {s.skillName}
                    </span>
                  ))}
                  {emp.skills.length > 3 && (
                    <span className="text-[11px] text-slate-400 px-1 py-0.5">
                      +{emp.skills.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerTeamSkills;