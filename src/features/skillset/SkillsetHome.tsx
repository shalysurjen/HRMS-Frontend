import React, { useState, useRef, useEffect } from "react";
import { skillsetService } from "@/features/skillset/skillsetService";
import type { SkillPayload } from "@/features/skillset/skillsetService";
// ── Types ──────────────────────────────────────────────────────────────────
type SkillType = "tech" | "tools" | "soft";

interface WeeklySkill {
  id: number;
  name: string;
  type: SkillType;
  rating: number;
  learn: string[];
  apply: string[];
  certDate: string;
  file: File | null;
}

// ── Constants ──────────────────────────────────────────────────────────────
const QUOTES = [
  "Every skill you add brings you one step closer to mastery.",
  "Your future self will thank you for the skills you learn today.",
  "Success is a collection of small technical wins over time.",
  "Knowledge is power; sharing it is leadership.",
  "Consistency is the secret bridge to expertise.",
];

const TECH_LABELS = ["", "Novice", "Adv. Beginner", "Competent", "Proficient", "Expert"];
const SOFT_LABELS = ["", "Aware", "Developing", "Effective", "Influential", "Transformational"];
const TOOL_LABELS = ["", "Basic", "Intermediate", "Advanced", "Expert", "Master"];

const SUGGESTIONS: Record<SkillType, string[]> = {
  tech: ["Java", "Python", "Spring Boot", "React", "SQL", "Maven", "Bootstrap", "Git"],
  tools: ["Docker", "Jenkins", "Kubernetes", "AWS", "Azure", "GitHub", "GitLab", "Jira"],
  soft: ["Leadership", "Public Speaking", "Communication", "Time Management", "Critical Thinking"],
};

const TYPE_COLORS: Record<SkillType, string> = {
  tech: "#2977d0",
  tools: "#6f42c1",
  soft: "#0aa4c8",
};

const TYPE_LABELS: Record<SkillType, string> = {
  tech: "Technical",
  tools: "Tools",
  soft: "Interpersonal",
};

// Map frontend SkillType → backend category enum
const toBackendCategory = (type: SkillType): SkillPayload["category"] => {
  if (type === "tech") return "TECHNICAL";
  if (type === "tools") return "TOOLS";
  return "INTERPERSONAL";
};

// ── Star Rating ────────────────────────────────────────────────────────────
function StarRating({
  rating,
  onChange,
  type,
}: {
  rating: number;
  onChange: (v: number) => void;
  type: SkillType;
}) {
  const [hover, setHover] = useState(0);
  const labels = type === "tech" ? TECH_LABELS : type === "tools" ? TOOL_LABELS : SOFT_LABELS;
  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <span
            key={v}
            onClick={() => onChange(v)}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer text-2xl transition-all duration-150 select-none"
            style={{ color: v <= (hover || rating) ? "#D4AF37" : "#dee2e6" }}
          >
            ★
          </span>
        ))}
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "#f1f3f5", color: "#555" }}
      >
        {hover || rating ? labels[hover || rating] : "Select rating"}
      </span>
    </div>
  );
}

// ── Tag Input ──────────────────────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onChange([...tags, input.trim()]);
      setInput("");
    }
  };

  const removeTag = (i: number) => {
    onChange(tags.filter((_, idx) => idx !== i));
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 bg-white min-h-10 cursor-text"
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md text-white"
          style={{ background: "#003566" }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="opacity-70 hover:opacity-100 leading-none text-xs ml-0.5"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="border-none outline-none text-sm flex-1 min-w-24 bg-transparent"
      />
    </div>
  );
}

// ── Weekly Skill Card ──────────────────────────────────────────────────────
function WeeklyCard({ skill }: { skill: WeeklySkill }) {
  const color = TYPE_COLORS[skill.type];
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      style={{ borderLeft: `5px solid ${color}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-sm text-gray-800">{skill.name}</div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ background: `${color}18`, color }}
          >
            {TYPE_LABELS[skill.type]}
          </span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v} style={{ color: v <= skill.rating ? "#D4AF37" : "#dee2e6", fontSize: "14px" }}>
              ★
            </span>
          ))}
        </div>
      </div>
      {skill.learn.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          <span className="font-semibold">Learned:</span> {skill.learn.join(", ")}
        </div>
      )}
      {skill.apply.length > 0 && (
        <div className="text-xs text-gray-500">
          <span className="font-semibold">Applied:</span> {skill.apply.join(", ")}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function SkillsetHome() {
  // Form state
  const [skillType, setSkillType] = useState<SkillType>("tech");
  const [skillName, setSkillName] = useState("");
  const [learnTags, setLearnTags] = useState<string[]>([]);
  const [applyTags, setApplyTags] = useState<string[]>([]);
  const [certDate, setCertDate] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [rating, setRating] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weekly skills — populated from API on mount, plus new ones added this session
  const [weeklySkills, setWeeklySkills] = useState<WeeklySkill[]>([]);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // ── Load existing skills on mount to show badge progress ─────────────────
  // We use the badge API for counts (lighter than fetching all skills)
  const [techToolCount, setTechToolCount] = useState(0);

  useEffect(() => {
    skillsetService.getMyBadges().then(({ data }) => {
      setTechToolCount(data.techToolCombined ?? 0);
    }).catch(() => {
      // Silently fail — badge strip is non-critical
    });
  }, []);

  const getBadgeProgress = () => {
    if (techToolCount < 5) return { diff: 5 - techToolCount, name: "Associate" };
    if (techToolCount < 12) return { diff: 12 - techToolCount, name: "Specialist" };
    if (techToolCount < 20) return { diff: 20 - techToolCount, name: "Authority" };
    return { diff: 0, name: "All Milestones" };
  };

  const { diff, name: badgeName } = getBadgeProgress();

  // ── Autocomplete ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!skillName.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = SUGGESTIONS[skillType].filter((s) =>
      s.toLowerCase().includes(skillName.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [skillName, skillType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Submit — calls real API ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim() || rating === 0) return;

    setSubmitting(true);
    setError(null);

    const payload: SkillPayload = {
      skillName: skillName.trim(),
      category: toBackendCategory(skillType),
      rating,
      learnedAt: learnTags.join(", ") || undefined,
      appliedAt: applyTags.join(", ") || undefined,
      certDate: certDate || undefined,
    };

    try {
      const { data } = await skillsetService.addSkill(payload, certFile ?? undefined);

      // Append to weekly skills display
      const newSkill: WeeklySkill = {
        id: data.id,
        name: data.skillName ?? data.name ?? skillName,
        type: skillType,
        rating,
        learn: learnTags,
        apply: applyTags,
        certDate,
        file: certFile,
      };
      setWeeklySkills((prev) => [newSkill, ...prev]);

      // Update badge count
      if (skillType === "tech" || skillType === "tools") {
        setTechToolCount((prev) => prev + 1);
      }

      // Reset form
      setSkillName("");
      setLearnTags([]);
      setApplyTags([]);
      setCertDate("");
      setCertFile(null);
      setRating(0);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save skill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#f8f9fa", fontFamily: "'Segoe UI', sans-serif" }}
    >
      <div className="container mx-auto px-4 mt-4 pb-12" style={{ maxWidth: "1200px" }}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <div className="lg:w-5/12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h5 className="font-bold text-base mb-4" style={{ color: "#2977d0" }}>
                Record New Competency
              </h5>

              {error && (
                <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Skill Type */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Skill Type
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                    value={skillType}
                    onChange={(e) => setSkillType(e.target.value as SkillType)}
                  >
                    <option value="tech">Technical Stack</option>
                    <option value="tools">Tools & Platforms</option>
                    <option value="soft">Interpersonal</option>
                  </select>
                </div>

                {/* Skill Name + Autocomplete */}
                <div className="relative" ref={suggestRef}>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                    placeholder="e.g., Java, Spring, Leadership"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {showSuggestions && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                      {suggestions.map((s) => (
                        <div
                          key={s}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                          onMouseDown={() => {
                            setSkillName(s);
                            setShowSuggestions(false);
                          }}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Where learned */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Where did you learn it?{" "}
                    <span className="font-normal normal-case text-gray-400">(Press Enter)</span>
                  </label>
                  <TagInput tags={learnTags} onChange={setLearnTags} placeholder="Add source..." />
                </div>

                {/* Where applied */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Where did you apply it?{" "}
                    <span className="font-normal normal-case text-gray-400">(Press Enter)</span>
                  </label>
                  <TagInput tags={applyTags} onChange={setApplyTags} placeholder="Add project/company..." />
                </div>

                {/* Cert + Date */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Certificate / Proof
                    </label>
                    <input
                      type="file"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                      onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                      Date Received
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                      value={certDate}
                      onChange={(e) => setCertDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Proficiency */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Proficiency Level
                  </label>
                  <StarRating rating={rating} onChange={setRating} type={skillType} />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-1 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #001d3d, #256096)" }}
                >
                  {submitting ? "Saving..." : "Record Skill"}
                </button>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Motivation + Weekly ──────────────────────────────── */}
          <div className="lg:w-7/12 flex flex-col gap-5">
            {/* Keep Growing card */}
            <div
              className="rounded-2xl p-5 text-white shadow-md"
              style={{ background: "linear-gradient(45deg, #001d3d, #256096)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">Keep Growing!</h4>
                  <p className="text-sm opacity-80 italic mb-3">"{quote}"</p>
                  <hr className="opacity-20 mb-3" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400">🚀</span>
                    {diff > 0 ? (
                      <span>
                        Add <strong>{diff} more</strong> tech/tool skills to unlock{" "}
                        <strong>{badgeName}</strong>!
                      </span>
                    ) : (
                      <span className="font-semibold">All Technical Milestones Achieved! 🎉</span>
                    )}
                  </div>
                </div>
                <div className="hidden md:block opacity-20 text-7xl ml-4">🏆</div>
              </div>
            </div>

            {/* Recently Added This Week */}
            <div>
              <h5
                className="text-sm font-semibold pb-2 mb-3"
                style={{ color: "#000509", borderBottom: "1px solid #dee2e6" }}
              >
                Recently Added (This Session)
              </h5>
              {weeklySkills.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  Add your first skill to see it here!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {weeklySkills.map((skill) => (
                    <WeeklyCard key={skill.id} skill={skill} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}