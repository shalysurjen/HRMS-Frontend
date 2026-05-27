import { useEffect, useState } from "react";
import { skillsetService } from "@/features/skillset/skillsetService";

// ── Types ──────────────────────────────────────────────────────────────────
interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  tier: string;
  milestone: number;
  description: string;
  gold?: boolean;
}

interface BadgeCardProps {
  badge: BadgeDef;
  currentCount: number;
  earnedDate?: string;
}

// ── Badge Definitions ──────────────────────────────────────────────────────
const techBadges: BadgeDef[] = [
  {
    id: "tech-1",
    icon: "🛡",
    title: "Associate",
    tier: "Tier I",
    milestone: 5,
    description: "Awarded for reaching 5 combined Tech & Tool skills.",
  },
  {
    id: "tech-2",
    icon: "⚙️",
    title: "Specialist",
    tier: "Tier II",
    milestone: 12,
    description: "Awarded for reaching 12 combined Tech & Tool skills.",
  },
  {
    id: "tech-3",
    icon: "💻",
    title: "Authority",
    tier: "Tier III",
    milestone: 20,
    description: "Awarded for reaching 20 combined Tech & Tool skills.",
    gold: true,
  },
];

const softBadges: BadgeDef[] = [
  {
    id: "soft-1",
    icon: "🪪",
    title: "Professional Core",
    tier: "Tier I",
    milestone: 3,
    description: "Awarded for reaching 3 Interpersonal skills.",
  },
  {
    id: "soft-2",
    icon: "👥",
    title: "Collaborator",
    tier: "Tier II",
    milestone: 10,
    description: "Awarded for reaching 10 Interpersonal skills.",
  },
  {
    id: "soft-3",
    icon: "⭐",
    title: "Strategic Lead",
    tier: "Tier III",
    milestone: 15,
    description: "Awarded for reaching 15 Interpersonal skills.",
    gold: true,
  },
];

// ── Badge Card ─────────────────────────────────────────────────────────────
function BadgeCard({ badge, currentCount, earnedDate }: BadgeCardProps) {
  const isUnlocked = currentCount >= badge.milestone;
  const pct = Math.min(100, Math.round((currentCount / badge.milestone) * 100));
  const needed = badge.milestone - currentCount;
  const isGold = badge.gold && isUnlocked;

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden transition-all duration-200"
      style={{
        background: isUnlocked ? "white" : "#f0f2f5",
        border: isUnlocked ? `1.5px solid #c8d9f0` : "1.5px dashed #d8dde4",
        boxShadow: isUnlocked ? "0 4px 18px rgba(0,53,102,0.1)" : "none",
      }}
      onMouseEnter={(e) => {
        if (isUnlocked) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 10px 28px rgba(0,53,102,0.16)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = isUnlocked
          ? "0 4px 18px rgba(0,53,102,0.1)"
          : "none";
      }}
    >
      {/* Top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{
          background: isUnlocked
            ? isGold
              ? "linear-gradient(90deg, #b8860b, #c9a227)"
              : "linear-gradient(90deg, #001d3d, #003566)"
            : "#e4e8ef",
        }}
      />

      {/* Earned ribbon */}
      {isUnlocked && (
        <div
          className="absolute top-3 right-0 text-white text-xs font-bold py-0.5 px-3 rounded-l"
          style={{
            background: "linear-gradient(135deg, #1a8a4a, #22a85c)",
            boxShadow: "-2px 2px 6px rgba(0,0,0,0.12)",
            fontSize: "0.6rem",
            letterSpacing: "0.05em",
          }}
        >
          ✓ EARNED
        </div>
      )}

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-all"
        style={{
          background: isUnlocked
            ? isGold
              ? "linear-gradient(135deg, #fdf3d0, #fce89a)"
              : "linear-gradient(135deg, #e8f0fb, #d0e0f7)"
            : "#eef2f8",
          opacity: isUnlocked ? 1 : 0.35,
          filter: isUnlocked ? "none" : "grayscale(1)",
          boxShadow: isUnlocked
            ? isGold
              ? "0 4px 12px rgba(201,162,39,0.25)"
              : "0 4px 12px rgba(0,53,102,0.15)"
            : "none",
        }}
      >
        {badge.icon}
      </div>

      {/* Tier label */}
      <div
        className="text-xs font-bold uppercase tracking-wide mb-1"
        style={{
          color: isUnlocked ? (isGold ? "#8a6200" : "#003566") : "#9aa3ae",
          letterSpacing: "0.08em",
        }}
      >
        {badge.tier}
      </div>

      {/* Name */}
      <div className="text-base font-black mb-1" style={{ color: isUnlocked ? "#001d3d" : "#9aa3ae" }}>
        {badge.title}
      </div>

      {/* Description */}
      <div className="text-xs leading-snug mb-4" style={{ color: isUnlocked ? "#6b7a8d" : "#b5bcc5" }}>
        {badge.description}
      </div>

      {/* Status pill */}
      {isUnlocked ? (
        <div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full"
            style={{ background: "#e6f4ee", color: "#1a8a4a", border: "1px solid #b3dfc7" }}
          >
            ✔ Earned
          </span>
          {earnedDate && (
            <div className="text-xs text-gray-400 italic mt-2 flex items-center gap-1">
              📅 {earnedDate}
            </div>
          )}
        </div>
      ) : (
        <div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full"
            style={{ background: "#eef0f4", color: "#9aa3ae", border: "1px solid #d8dde4" }}
          >
            🔒 Locked
          </span>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{needed} more needed</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #003566, #2977d0)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Strip ──────────────────────────────────────────────────────────
function SummaryStrip({ techToolCount, softCount }: { techToolCount: number; softCount: number }) {
  const allBadges = [...techBadges, ...softBadges];
  const earned = allBadges.filter((b) => {
    const count = techBadges.includes(b) ? techToolCount : softCount;
    return count >= b.milestone;
  }).length;
  const locked = allBadges.length - earned;
  const nextTech = techBadges.find((b) => techToolCount < b.milestone);
  const nextSoft = softBadges.find((b) => softCount < b.milestone);
  let nextNum: string | number = "✓";
  let nextLabel = "All badges earned!";
  if (nextTech) {
    nextNum = nextTech.milestone - techToolCount;
    nextLabel = nextTech.title + " badge";
  } else if (nextSoft) {
    nextNum = nextSoft.milestone - softCount;
    nextLabel = nextSoft.title + " badge";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {[
        {
          cls: "earned",
          num: earned,
          label: "Badges Earned",
          sub: "Milestones unlocked",
          accent: "#1a8a4a",
          numColor: "#1a8a4a",
        },
        {
          cls: "locked",
          num: locked,
          label: "Locked",
          sub: "Still to achieve",
          accent: "#d8dde4",
          numColor: "#001d3d",
        },
        {
          cls: "next",
          num: nextNum,
          label: "Skills to Next",
          sub: nextLabel,
          accent: "#c9a227",
          numColor: "#c9a227",
        },
      ].map((s) => (
        <div
          key={s.cls}
          className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
          style={{ borderLeft: `4px solid ${s.accent}` }}
        >
          <div className="text-4xl font-black leading-none" style={{ color: s.numColor }}>
            {s.num}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{s.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Journey Section ────────────────────────────────────────────────────────
function JourneySection({
  title,
  icon,
  iconColor,
  badges,
  currentCount,
  earnedCount,
  totalCount,
  containerId,
}: {
  title: string;
  icon: string;
  iconColor: string;
  badges: BadgeDef[];
  currentCount: number;
  earnedCount: number;
  totalCount: number;
  containerId: string;
}) {
  return (
    <div className="mb-10">
      <div
        className="flex items-center gap-3 mb-5 pb-3"
        style={{ borderBottom: "2px solid #e4e8ef" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base"
          style={{ background: iconColor }}
        >
          {icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest text-[#001d3d]">{title}</h2>
        <span
          className="ml-auto text-xs font-semibold text-gray-400 px-3 py-0.5 rounded-full"
          style={{ background: "#eef0f4" }}
        >
          {earnedCount} / {totalCount} earned
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id={containerId}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} currentCount={currentCount} />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Badges() {
  const [techToolCount, setTechToolCount] = useState(0);
  const [softCount, setSoftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    skillsetService
      .getMyBadges()
      .then(({ data }) => {
        setTechToolCount(data.techToolCombined ?? 0);
        setSoftCount(data.interpersonalCount ?? 0);
      })
      .catch(() => {
        // fallback to 0s — badge page still renders
      })
      .finally(() => setLoading(false));
  }, []);

  const techEarned = techBadges.filter((b) => techToolCount >= b.milestone).length;
  const softEarned = softBadges.filter((b) => softCount >= b.milestone).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Loading badges...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#f0f2f6", fontFamily: "'Segoe UI', sans-serif" }}
    >
      <div className="container mx-auto px-4 mt-6 pb-12">
        {/* Page Header */}
        <div
          className="bg-white rounded-2xl p-6 mb-8 flex items-center gap-6"
          style={{ borderLeft: "5px solid #001d3d", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-3xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #001d3d, #003566)" }}
          >
            🏆
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001d3d] mb-0.5">
              Professional Milestone Gallery
            </h1>
            <p className="text-gray-400 text-sm">
              Track the badges you've earned and the milestones ahead of you.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <SummaryStrip techToolCount={techToolCount} softCount={softCount} />

        {/* Technical Journey */}
        <JourneySection
          title="Technical Stack & Tools Journey"
          icon="💻"
          iconColor="#2977d0"
          badges={techBadges}
          currentCount={techToolCount}
          earnedCount={techEarned}
          totalCount={techBadges.length}
          containerId="techBadgesContainer"
        />

        {/* Interpersonal Journey */}
        <JourneySection
          title="Interpersonal Journey"
          icon="👥"
          iconColor="#0aa4c8"
          badges={softBadges}
          currentCount={softCount}
          earnedCount={softEarned}
          totalCount={softBadges.length}
          containerId="softBadgesContainer"
        />
      </div>
    </div>
  );
}