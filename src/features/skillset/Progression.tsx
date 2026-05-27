import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { skillsetService } from "@/features/skillset/skillsetService";
type Category = "tech" | "tool" | "soft";

interface SkillEntry {
  name: string;
  rating: number;
}

interface SkillsData {
  tech: SkillEntry[];
  tools: SkillEntry[];
  soft: SkillEntry[];
}

function avg(arr: SkillEntry[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x.rating, 0) / arr.length;
}

const COLORS: Record<Category, string> = { tech: "#2977d0", tool: "#6f42c1", soft: "#0aa4c8" };
const LEVEL_NAMES = ["Novice", "Adv. Beginner", "Competent", "Proficient", "Expert"];

const CAT_CONFIG: Record<Category, { label: string; icon: string }> = {
  tech: { label: "Technical Stack", icon: "💻" },
  tool: { label: "Tools & Platforms", icon: "🛠" },
  soft: { label: "Interpersonal Skills", icon: "🤝" },
};

function StatCard({
  count,
  label,
  sub,
  color,
}: {
  count: number;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-4 bg-gray-50 rounded-xl p-3"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div
        className="text-4xl font-black"
        style={{ color, minWidth: "48px", textAlign: "center" }}
      >
        {count}
      </div>
      <div>
        <div className="font-bold text-gray-700 text-sm">{label}</div>
        <div className="text-xs text-gray-400">{sub}</div>
      </div>
    </div>
  );
}

function DeepDiveCard({
  cat,
  label,
  icon,
  skills,
  active,
  onClick,
}: {
  cat: Category;
  label: string;
  icon: string;
  skills: SkillEntry[];
  active: boolean;
  onClick: () => void;
}) {
  const color = COLORS[cat];
  const avgVal = avg(skills);
  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderLeft: `4px solid ${color}`,
        boxShadow: active ? `0 0 0 3px ${color}33, 0 8px 24px ${color}22` : "0 2px 10px rgba(0,0,0,0.07)",
        border: active ? `2.5px solid ${color}` : "1.5px solid #e4e8ef",
        background: active ? `${color}08` : "white",
      }}
    >
      {active && (
        <span
          className="absolute top-2.5 right-2.5 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}
        >
          Viewing
        </span>
      )}
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold text-[#001d3d] text-sm mb-0.5">{label}</div>
      <div className="text-xs text-gray-400 mb-3">
        {skills.length} skill{skills.length !== 1 ? "s" : ""}
      </div>
      <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">
        Avg Proficiency
      </div>
      <div className="text-2xl font-black" style={{ color }}>
        {avgVal.toFixed(1)}/5
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${avgVal * 20}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Timeline({
  category,
  skillsData,
}: {
  category: Category;
  skillsData: SkillsData;
}) {
  const techToolTotal = skillsData.tech.length + skillsData.tools.length;
  const softCount = skillsData.soft.length;
  const toolCount = skillsData.tools.length;

  const hints: Record<Category, { icon: string; msg: string }> = {
    tech:
      techToolTotal >= 20
        ? { icon: "👑", msg: "Technical Authority badge unlocked — master level!" }
        : {
            icon: "🎯",
            msg: `${Math.max(0, 12 - techToolTotal)} more technical/tool skills needed to reach Specialist.`,
          },
    tool:
      toolCount >= 10
        ? { icon: "👑", msg: "Platform Specialist badge unlocked!" }
        : {
            icon: "🎯",
            msg: `${Math.max(0, 5 - toolCount)} more Tools & Platforms skills needed for DevOps Practitioner.`,
          },
    soft:
      softCount >= 15
        ? { icon: "👑", msg: "Strategic Lead badge unlocked!" }
        : {
            icon: "🎯",
            msg: `${Math.max(0, 10 - softCount)} more interpersonal skills needed for Versatile Collaborator.`,
          },
  };

  const milestones: Record<Category, { date: string; title: string; desc: string; unlocked: boolean }[]> = {
    tech: [
      {
        date: techToolTotal >= 5 ? "Earned" : "Goal",
        title: "🎖 Technical Associate Badge",
        desc: "Reach 5 technical & tool skills",
        unlocked: techToolTotal >= 5,
      },
      {
        date: "Next Goal",
        title: "📍 Technical Specialist Badge",
        desc: `Reach 12 technical & tool skills (${Math.max(0, 12 - techToolTotal)} more to go!)`,
        unlocked: techToolTotal >= 12,
      },
      {
        date: "Ultimate Goal",
        title: "👑 Technical Authority Badge",
        desc: "Reach 20 technical & tool skills",
        unlocked: techToolTotal >= 20,
      },
    ],
    tool: [
      {
        date: techToolTotal >= 5 ? "Earned" : "Goal",
        title: "🎖 Technical Associate Badge",
        desc: "Included Tools & Platforms in your profile",
        unlocked: techToolTotal >= 5,
      },
      {
        date: "Next Goal",
        title: "📍 DevOps Practitioner Badge",
        desc: `Reach 5 Tools & Platforms skills (${Math.max(0, 5 - toolCount)} more!)`,
        unlocked: toolCount >= 5,
      },
      {
        date: "Future Goal",
        title: "📍 Platform Specialist Badge",
        desc: "Reach 10 Tools & Platforms skills",
        unlocked: toolCount >= 10,
      },
    ],
    soft: [
      {
        date: softCount >= 3 ? "Earned" : "Goal",
        title: "🎖 Professional Core Badge",
        desc: "Reach 3 interpersonal skills",
        unlocked: softCount >= 3,
      },
      {
        date: "Next Goal",
        title: "📍 Versatile Collaborator Badge",
        desc: `Reach 10 interpersonal skills (${Math.max(0, 10 - softCount)} more!)`,
        unlocked: softCount >= 10,
      },
      {
        date: "Ultimate Goal",
        title: "👑 Strategic Lead Badge",
        desc: "Reach 15 interpersonal skills",
        unlocked: softCount >= 15,
      },
    ],
  };

  const hint = hints[category];
  const borderColor: Record<Category, string> = {
    tech: "rgba(41,119,208,0.35)",
    tool: "rgba(111,66,193,0.35)",
    soft: "rgba(10,164,200,0.35)",
  };
  const bgColor: Record<Category, string> = {
    tech: "rgba(41,119,208,0.04)",
    tool: "rgba(111,66,193,0.04)",
    soft: "rgba(10,164,200,0.04)",
  };
  const labelColor: Record<Category, string> = { tech: "#2977d0", tool: "#6f42c1", soft: "#0aa4c8" };

  return (
    <div>
      <div
        className="flex items-start gap-3 rounded-xl p-3 mb-5 text-sm"
        style={{ border: `1.5px dashed ${borderColor[category]}`, background: bgColor[category] }}
      >
        <span className="text-base mt-0.5">{hint.icon}</span>
        <div>
          <div
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: labelColor[category] }}
          >
            Next Badge Milestone
          </div>
          <div className="font-semibold text-[#001d3d] leading-snug">{hint.msg}</div>
        </div>
      </div>
      <div className="relative pl-14">
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{ background: "linear-gradient(180deg, #003566, transparent)" }}
        />
        {milestones[category].map((item, i) => (
          <div key={i} className="relative mb-6">
            <div
              className="absolute left-[-34px] top-1.5 w-4 h-4 rounded-full border-2 z-10"
              style={{
                background: item.unlocked ? "#003566" : "white",
                borderColor: "#003566",
                boxShadow: item.unlocked ? "0 0 10px rgba(0,53,102,0.4)" : "none",
              }}
            />
            <div className="bg-white rounded-lg p-3" style={{ borderLeft: "3px solid #003566" }}>
              <div className="text-xs text-gray-400 mb-1">{item.date}</div>
              <div className="font-semibold text-[#001d3d] text-sm mb-0.5">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Progression() {
  const [skillsData, setSkillsData] = useState<SkillsData>({ tech: [], tools: [], soft: [] });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [timelineCategory, setTimelineCategory] = useState<Category>("tech");

  useEffect(() => {
    Promise.all([
      skillsetService.getMySkills(),
      skillsetService.getMyBadges(),
    ])
      .then(([skillsRes]) => {
        const all: any[] = skillsRes.data;

        const tech: SkillEntry[] = [];
        const tools: SkillEntry[] = [];
        const soft: SkillEntry[] = [];

        all.forEach((s) => {
          const entry: SkillEntry = {
            name: s.skillName ?? s.name ?? "Unknown",
            rating: s.rating ?? s.stars ?? 0,
          };
          const cat: string = s.category ?? "";
          if (cat === "TECHNICAL" || cat === "Technical") tech.push(entry);
          else if (cat === "TOOLS" || cat === "Tools & Platforms") tools.push(entry);
          else if (cat === "INTERPERSONAL" || cat === "Interpersonal") soft.push(entry);
        });

        setSkillsData({ tech, tools, soft });
      })
      .catch(() => {
        // silently fail — page renders with zeros
      })
      .finally(() => setLoading(false));
  }, []);

  const techCount = skillsData.tech.length;
  const toolCount = skillsData.tools.length;
  const softCount = skillsData.soft.length;
  const totalCount = techCount + toolCount + softCount;

  const pieData = [
    { name: "Technical", value: techCount, color: "#2977d0" },
    { name: "Tools", value: toolCount, color: "#6f42c1" },
    { name: "Interpersonal", value: softCount, color: "#0aa4c8" },
  ];

  const avgMap = {
    tech: avg(skillsData.tech),
    tool: avg(skillsData.tools),
    soft: avg(skillsData.soft),
  };

  const catNames: Record<Category, string> = {
    tech: "Technical Stack",
    tool: "Tools & Platforms",
    soft: "Interpersonal",
  };

  const sorted = Object.entries(avgMap).sort(([, a], [, b]) => b - a) as [Category, number][];
  const bestCat = sorted[0];
  const weakCat = sorted[sorted.length - 1];

  const insights = [
    {
      icon: "🔥",
      title: "Most Developed Area",
      text:
        bestCat[1] > 0
          ? `Your ${catNames[bestCat[0]]} skills lead with an average of ${bestCat[1].toFixed(1)}/5.0. Keep building on this strong foundation.`
          : "Add skills to see your strongest area.",
    },
    {
      icon: "🎯",
      title: "Area to Focus On",
      text:
        weakCat[1] > 0
          ? `${catNames[weakCat[0]]} has the lowest average (${weakCat[1].toFixed(1)}/5.0). Adding 2–3 skills here will balance your profile.`
          : "Start adding skills across all categories to get insights.",
    },
    {
      icon: "⊞",
      title: "Skill Breadth",
      text: `You have ${totalCount} skills across ${[techCount > 0, toolCount > 0, softCount > 0].filter(Boolean).length} categories${totalCount > 0 ? " — a versatile and well-rounded profile." : ". Start adding skills to grow your profile."}`,
    },
  ];

  const FilterBtn = ({ cat, label }: { cat: Category; label: string }) => {
    const color = COLORS[cat];
    const active = timelineCategory === cat;
    return (
      <button
        onClick={() => setTimelineCategory(cat)}
        className="rounded-full px-4 py-1.5 text-sm font-semibold border-2 transition-all"
        style={{
          background: active ? color : "white",
          borderColor: active ? color : "#e0e0e0",
          color: active ? "white" : "#555",
        }}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Loading progression data...
      </div>
    );
  }

  // Active category skills (for deep dive panel)
  const activeCatSkills: SkillEntry[] =
    activeCategory === "tech"
      ? skillsData.tech
      : activeCategory === "tool"
      ? skillsData.tools
      : activeCategory === "soft"
      ? skillsData.soft
      : [];

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="container mx-auto px-4 mt-6 pb-12">
        <div
          className="text-center py-8 mb-8 rounded-2xl"
          style={{ background: "rgba(0,29,61,0.04)", border: "2px solid rgba(0,53,102,0.1)" }}
        >
          <div className="text-5xl mb-3" style={{ color: "#003566" }}>
            📈
          </div>
          <h1 className="text-4xl font-black text-[#001d3d] mb-2">Your Learning Progression</h1>
          <p className="text-gray-500 text-base">
            Track your skill development and professional growth over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-md" style={{ borderTop: "4px solid #003566" }}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                Skill Breakdown
              </div>
              <div className="flex flex-col gap-3">
                <StatCard count={techCount} label="Technical Skills" sub="Stack & Languages" color="#2977d0" />
                <StatCard count={toolCount} label="Tools & Platforms" sub="DevOps & Infrastructure" color="#6f42c1" />
                <StatCard count={softCount} label="Interpersonal Skills" sub="People & Leadership" color="#0aa4c8" />
              </div>
            </div>

            <div
              className="bg-white rounded-2xl p-5 shadow-lg flex items-center gap-5"
              style={{ borderTop: "4px solid #001d3d" }}
            >
              <div className="text-5xl font-black text-[#001d3d] min-w-[52px] text-center">
                {totalCount}
              </div>
              <div>
                <div className="font-black text-base text-gray-800">Total Skills</div>
                <div className="text-xs text-gray-400 mt-0.5">All Competencies</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(41,119,208,0.12)", color: "#2977d0" }}
                  >
                    {techCount} Technical
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(111,66,193,0.12)", color: "#6f42c1" }}
                  >
                    {toolCount} Tools
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(10,164,200,0.12)", color: "#0aa4c8" }}
                  >
                    {softCount} Interpersonal
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md" style={{ borderTop: "4px solid #003566" }}>
            <h3 className="text-[#001d3d] font-bold text-lg flex items-center gap-2 mb-1">
              <span className="text-2xl text-[#003566]">📊</span> Skill Distribution
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Breakdown of your competencies across categories
            </p>
            {totalCount === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                No skills yet — add some to see your chart!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {pieData.filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex gap-5 flex-wrap pt-3 border-t border-gray-100 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deep Dive */}
        <div
          className="bg-white rounded-2xl p-6 shadow-md mb-8"
          style={{ borderTop: "4px solid #003566" }}
        >
          <h3 className="text-[#001d3d] font-bold text-lg flex items-center gap-2 mb-1">
            <span className="text-2xl text-[#003566]">⚡</span> Category Deep Dive
          </h3>
          <p className="text-gray-500 text-sm mb-5">
            Click a category to explore its proficiency distribution
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {(["tech", "tool", "soft"] as Category[]).map((cat) => {
              const skills =
                cat === "tech" ? skillsData.tech : cat === "tool" ? skillsData.tools : skillsData.soft;
              return (
                <DeepDiveCard
                  key={cat}
                  cat={cat}
                  label={CAT_CONFIG[cat].label}
                  icon={CAT_CONFIG[cat].icon}
                  skills={skills}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory((prev) => (prev === cat ? null : cat))}
                />
              );
            })}
          </div>

          {activeCategory && (
            <div
              className="rounded-2xl p-5 bg-white shadow-md"
              style={{ borderLeft: `5px solid ${COLORS[activeCategory]}` }}
            >
              <div className="font-bold text-[#001d3d] flex items-center gap-2 mb-0.5">
                <span>{CAT_CONFIG[activeCategory].icon}</span>
                {CAT_CONFIG[activeCategory].label} — Proficiency Breakdown
              </div>
              <div className="text-xs text-gray-400 mb-5">
                {activeCatSkills.length} skill{activeCatSkills.length !== 1 ? "s" : ""} · Average:{" "}
                {avg(activeCatSkills).toFixed(1)}/5.0
              </div>
              {activeCatSkills.length === 0 ? (
                <p className="text-sm text-gray-400">No skills in this category yet.</p>
              ) : (
                [...activeCatSkills].sort((a, b) => b.rating - a.rating).map((s, i) => {
                  const levelColors: Record<number, string> = {
                    1: "#b8860b", 2: "#cc6600", 3: "#b23c17", 4: "#303f9f", 5: "#1a6e1a",
                  };
                  const levelBgs: Record<number, string> = {
                    1: "rgba(255,193,7,0.15)", 2: "rgba(255,152,0,0.15)", 3: "rgba(255,87,34,0.15)",
                    4: "rgba(63,81,181,0.15)", 5: "rgba(0,128,0,0.12)",
                  };
                  return (
                    <div key={i} className="flex items-center gap-3 mb-4">
                      <div className="text-sm font-semibold text-[#001d3d] min-w-[120px]">{s.name}</div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${s.rating * 20}%`, background: COLORS[activeCategory] }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 min-w-[32px] text-right">{s.rating}/5</div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[70px] text-center"
                        style={{ background: levelBgs[s.rating], color: levelColors[s.rating] }}
                      >
                        {LEVEL_NAMES[s.rating - 1]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Insights + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-md" style={{ borderTop: "4px solid #003566" }}>
            <h3 className="text-[#001d3d] font-bold text-lg flex items-center gap-2 mb-4">
              <span className="text-2xl text-[#003566]">💡</span> Key Insights
            </h3>
            <div className="flex flex-col gap-4">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="rounded-xl px-5 py-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.9) 100%)",
                    borderLeft: "4px solid #003566",
                  }}
                >
                  <h4 className="text-[#001d3d] font-bold text-sm flex items-center gap-2 mb-1">
                    <span>{ins.icon}</span>
                    {ins.title}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md" style={{ borderTop: "4px solid #003566" }}>
            <h3 className="text-[#001d3d] font-bold text-lg flex items-center gap-2 mb-1">
              <span className="text-2xl text-[#003566]">📅</span> Milestone Timeline
            </h3>
            <p className="text-gray-500 text-sm mb-4">Filter milestones by category</p>
            <div className="flex flex-wrap gap-2 mb-5">
              <FilterBtn cat="tech" label="Technical Stack" />
              <FilterBtn cat="tool" label="Tools & Platforms" />
              <FilterBtn cat="soft" label="Interpersonal" />
            </div>
            <Timeline category={timelineCategory} skillsData={skillsData} />
          </div>
        </div>
      </div>
    </div>
  );
}