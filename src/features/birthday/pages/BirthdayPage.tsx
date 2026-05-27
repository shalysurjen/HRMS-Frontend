import { useAuth } from "@/shared/auth/useAuth";
import { useEffect, useState } from "react";
import { birthdayService } from "../services/birthdayService";
import type { BirthdayEmployee, BirthdayWish } from "../types/birthdayTypes";
import SendWishModal from "../components/SendWishModal";

type Tab = "today" | "week" | "month";

const AV_COLORS = [
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
];
const getAv = (i: number) => AV_COLORS[i % AV_COLORS.length];

const BirthdayPage = () => {
  const { user, isLoading: authLoading } = useAuth();

  // ✅ FIX: firstName + lastName ஓட compare பண்றோம் — 100% reliable
  const currentUserId: string | null = user?.id ?? null;
  const currentFirstName = user?.firstName ?? "";
  const currentLastName = user?.lastName ?? "";

  const [tab, setTab] = useState<Tab>("today");
  const [todays, setTodays] = useState<BirthdayEmployee[]>([]);
  const [weekly, setWeekly] = useState<BirthdayEmployee[]>([]);
  const [monthly, setMonthly] = useState<BirthdayEmployee[]>([]);
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());

  const [myWishes, setMyWishes] = useState<BirthdayWish[]>([]);

  const [wishWallEmp, setWishWallEmp] = useState<BirthdayEmployee | null>(null);
  const [wishes, setWishes] = useState<BirthdayWish[]>([]);

  const [selected, setSelected] = useState<BirthdayEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      try {
        const [t, w, m] = await Promise.all([
          birthdayService.getTodayBirthdays(),
          birthdayService.getWeeklyBirthdays(),
          birthdayService.getMonthlyBirthdays(),
        ]);

        setTodays(t);
        const todayIds = new Set<string>(t.map(e => e.id));
        setWeekly(w.filter(e => !todayIds.has(e.id)));
        setMonthly(m.filter(e => !todayIds.has(e.id)));

        // ✅ FIX: firstName + lastName match பண்றோம்
        const me = t.find(
          e =>
            e.firstName.trim().toLowerCase() === currentFirstName.trim().toLowerCase() &&
            e.lastName.trim().toLowerCase() === currentLastName.trim().toLowerCase()
        );

        // ✅ என் wishes — என் employee id ஓட fetch பண்றோம்
        if (me) {
          const myWs = await birthdayService.getWishes(me.id);
          setMyWishes(myWs);
        }

        // ✅ மத்தவங்க wish wall — first other person default
        const others = me ? t.filter(e => e.id !== me.id) : t;
        if (others.length > 0) {
          setWishWallEmp(others[0]);
          const ws = await birthdayService.getWishes(others[0].id);
          setWishes(ws);
        }

        // ✅ wished check
        if (!currentUserId) return;
        const checks = await Promise.all(
          t.map(e => birthdayService.checkAlreadyWished(e.id, currentUserId))
        );
        const w2 = new Set<string>();
        t.forEach((e, i) => { if (checks[i]) w2.add(e.id); });
        setWishedIds(w2);

      } catch (e) {
        console.error("BirthdayPage load failed", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUserId, currentFirstName, currentLastName, authLoading]);

  const loadWishWall = async (emp: BirthdayEmployee) => {
    setWishWallEmp(emp);
    try {
      const ws = await birthdayService.getWishes(emp.id);
      setWishes(ws);
    } catch {
      setWishes([]);
    }
  };

  const handleWishSent = (id: string) => {
    setWishedIds(prev => new Set(prev).add(id));
    if (wishWallEmp?.id === id) {
      birthdayService.getWishes(id).then(setWishes).catch(() => {});
    }
  };

  // ✅ FIX: firstName + lastName compare
  const myBirthday =
    todays.find(
      e =>
        e.firstName.trim().toLowerCase() === currentFirstName.trim().toLowerCase() &&
        e.lastName.trim().toLowerCase() === currentLastName.trim().toLowerCase()
    ) ?? null;

  const otherBirthdays = myBirthday
    ? todays.filter(e => e.id !== myBirthday.id)
    : todays;

  const upcomingList = tab === "week" ? weekly : monthly;

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-6 py-8">

      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Birthdays 🎂</h1>
        <p className="text-sm text-gray-500 mt-1">Celebrate your colleagues' special day</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {(["today", "week", "month"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all
              ${tab === t
                ? "bg-pink-50 text-pink-700 border-pink-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
          >
            {t === "today"
              ? `Today (${todays.length})`
              : t === "week"
                ? `This Week (${weekly.length})`
                : `This Month (${monthly.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-2 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {tab === "today" && (
            <>
              {todays.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <p className="text-4xl mb-3">🎂</p>
                  <p className="text-slate-500 font-medium">No birthdays today</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">

                  {/* ✅ உன் Birthday — top special card */}
                  {myBirthday && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-300 p-5 shadow-md">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black bg-pink-200 text-pink-800 flex-shrink-0">
                          {myBirthday.firstName[0]}{myBirthday.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-slate-900 text-sm">
                            {myBirthday.firstName} {myBirthday.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {myBirthday.employeeCode} · {myBirthday.department}
                          </p>
                        </div>
                        <span className="text-2xl">🎂</span>
                      </div>

                      <div className="w-full py-2 rounded-xl bg-pink-200 text-pink-800 text-xs font-black text-center mb-4">
                        🎉 Your Birthday! Wishes from your colleagues 👇
                      </div>

                      {/* ✅ உன் wishes மட்டும் — specific-ஆ */}
                      {myWishes.length === 0 ? (
                        <div className="bg-white rounded-xl p-4 border border-pink-100 text-center">
                          <p className="text-xs text-slate-400">No wishes yet... 🎁</p>
                        </div>
                      ) : (
                       <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
  {myWishes.map(w => (
    <div key={w.id} className="bg-white rounded-xl p-3 border border-pink-100 shadow-sm">
      <p className="text-xs font-black text-pink-700">
        {w.wishedByName} - {w.wishedByEmployeeId}
      </p>
      <p className="text-xs text-slate-600 mt-1">{w.wishMessage}</p>
    </div>
  ))}
</div>
                      )}
                    </div>
                  )}

                  {/* ✅ மத்தவங்க Birthdays */}
                  {otherBirthdays.length > 0 && (
                    <>
                      {myBirthday && (
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest -mb-3">
                          Other Birthdays Today
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherBirthdays.map((emp, idx) => (
                          <div key={emp.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${getAv(idx)}`}>
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm truncate">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-xs text-slate-400">{emp.employeeCode}</p>
                                <p className="text-xs text-slate-400">{emp.department}</p>
                              </div>
                            </div>

                            {wishedIds.has(emp.id) ? (
                              <button
                                onClick={() => loadWishWall(emp)}
                                className="w-full py-2 rounded-xl border border-slate-200 text-xs text-slate-500 font-bold hover:bg-slate-50"
                              >
                                View Wish Wall 👀
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelected(emp)}
                                className="w-full py-2 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 text-xs font-black hover:bg-pink-100"
                              >
                                Send Wish 🎁
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* ✅ மத்தவங்க Wish Wall */}
                      {wishWallEmp && wishes.length > 0 && (
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-200 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">🎉</span>
                            <h2 className="font-black text-pink-800 text-sm">
                              Wish Wall — {wishWallEmp.firstName} {wishWallEmp.lastName} ({wishWallEmp.employeeCode})
                            </h2>
                            <span className="ml-auto text-[10px] bg-pink-100 text-pink-600 border border-pink-200 rounded-full px-2 py-0.5 font-bold">
                              {wishes.length} wishes
                            </span>
                          </div>
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {wishes.map(w => (
                              <div key={w.id} className="bg-white rounded-xl p-3 border border-pink-100 shadow-sm">
                                <p className="text-xs font-black text-pink-700">
                                  {w.wishedByName} - {w.wishedByEmployeeId}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{w.wishMessage}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>
              )}
            </>
          )}

          {/* WEEK / MONTH TAB */}
          {(tab === "week" || tab === "month") && (
            <>
              {upcomingList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="text-slate-500 font-medium">
                    No upcoming birthdays this {tab === "week" ? "week" : "month"}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  {upcomingList.map((emp, idx) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${getAv(idx)}`}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {emp.firstName} {emp.lastName}-{emp.employeeCode}
                        </p>
                        <p className="text-xs text-slate-400">{emp.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">
                          {new Date(emp.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* SEND WISH MODAL */}
      {selected && currentUserId && (
        <SendWishModal
          employee={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onWishSent={handleWishSent}
        />
      )}
    </div>
  );
};

export default BirthdayPage;