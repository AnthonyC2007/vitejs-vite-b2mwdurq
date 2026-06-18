import { useState, useEffect } from "react";

const WORKOUT_PLAN: Record<string, {
  label: string;
  subtitle: string;
  emoji: string;
  color: string;
  exercises: { name: string; sets: number; reps: string }[];
}> = {
  "Upper A": {
    label: "Upper A",
    subtitle: "Push Focus",
    emoji: "💪",
    color: "#3B82F6",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "6–8" },
      { name: "Overhead Press (Barbell)", sets: 3, reps: "8–10" },
      { name: "Incline DB Press", sets: 3, reps: "10–12" },
      { name: "DB Lateral Raises", sets: 3, reps: "12–15" },
      { name: "Tricep Skull Crushers", sets: 3, reps: "10–12" },
      { name: "Face Pulls / Band Pull-Aparts", sets: 2, reps: "15" },
    ],
  },
  "Lower A": {
    label: "Lower A",
    subtitle: "Quad Focus",
    emoji: "🦵",
    color: "#10B981",
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: "6–8" },
      { name: "Bulgarian Split Squat (DB)", sets: 3, reps: "10 each" },
      { name: "Goblet Squat", sets: 3, reps: "12–15" },
      { name: "Walking DB Lunges", sets: 2, reps: "12 each" },
      { name: "Calf Raises", sets: 4, reps: "15–20" },
    ],
  },
  "Upper B": {
    label: "Upper B",
    subtitle: "Pull Focus",
    emoji: "🔄",
    color: "#8B5CF6",
    exercises: [
      { name: "Barbell Row (Bent-Over)", sets: 4, reps: "6–8" },
      { name: "Pull-Ups / Chin-Ups", sets: 3, reps: "Max" },
      { name: "DB Single-Arm Row", sets: 3, reps: "10–12" },
      { name: "DB Bicep Curls", sets: 3, reps: "10–12" },
      { name: "Hammer Curls", sets: 2, reps: "12" },
      { name: "DB Rear Delt Fly", sets: 3, reps: "12–15" },
    ],
  },
  "Lower B": {
    label: "Lower B",
    subtitle: "Hamstring / Glute Focus",
    emoji: "🏋️",
    color: "#F59E0B",
    exercises: [
      { name: "Romanian Deadlift (Barbell)", sets: 4, reps: "8–10" },
      { name: "Barbell Hip Thrust", sets: 3, reps: "10–12" },
      { name: "Lying DB Leg Curl", sets: 3, reps: "10–12" },
      { name: "Sumo Deadlift", sets: 3, reps: "8" },
      { name: "Calf Raises", sets: 4, reps: "15–20" },
    ],
  },
};

const DAYS = ["Upper A", "Lower A", "Upper B", "Lower B"];

type SetEntry = { weight: string; reps: string; done: boolean };
type SessionSets = Record<number, SetEntry[]>;
type Session = { day: string; date: string; sets: SessionSets; completedAt: string };
type History = Record<string, Session>;

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
}

const STORAGE_KEY = "anthony-workout-history";

function loadHistory(): History {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHistoryToStorage(history: History) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    console.error("Could not save to localStorage");
  }
}

export default function WorkoutTracker() {
  const [view, setView] = useState<"home" | "workout" | "history">("home");
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [sessionDate] = useState(getTodayStr());
  const [sets, setSets] = useState<SessionSets>({});
  const [sessionComplete, setSessionComplete] = useState(false);
  const [history, setHistory] = useState<History>({});
  const [historyFilter, setHistoryFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function persistHistory(newHistory: History) {
    setHistory(newHistory);
    saveHistoryToStorage(newHistory);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function startWorkout(day: string) {
    const plan = WORKOUT_PLAN[day];
    const initSets: SessionSets = {};
    plan.exercises.forEach((ex, i) => {
      initSets[i] = Array.from({ length: ex.sets }, () => ({ weight: "", reps: "", done: false }));
    });
    setSets(initSets);
    setActiveDay(day);
    setSessionComplete(false);
    setView("workout");
  }

  function updateSet(exIdx: number, setIdx: number, field: "weight" | "reps", value: string) {
    setSets((prev) => {
      const updated = { ...prev };
      updated[exIdx] = updated[exIdx].map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
      return updated;
    });
  }

  function toggleSetDone(exIdx: number, setIdx: number) {
    setSets((prev) => {
      const updated = { ...prev };
      updated[exIdx] = updated[exIdx].map((s, i) => (i === setIdx ? { ...s, done: !s.done } : s));
      return updated;
    });
  }

  function addSet(exIdx: number) {
    setSets((prev) => {
      const updated = { ...prev };
      updated[exIdx] = [...updated[exIdx], { weight: "", reps: "", done: false }];
      return updated;
    });
  }

  function removeSet(exIdx: number) {
    setSets((prev) => {
      const updated = { ...prev };
      if (updated[exIdx].length > 1) {
        updated[exIdx] = updated[exIdx].slice(0, -1);
      }
      return updated;
    });
  }

  function countDoneSets() {
    return Object.values(sets).flat().filter((s) => s.done).length;
  }

  function countTotalSets() {
    return Object.values(sets).flat().length;
  }

  function finishWorkout() {
    if (!activeDay) return;
    const key = `session:${activeDay}:${sessionDate}:${Date.now()}`;
    const newHistory: History = {
      ...history,
      [key]: { day: activeDay, date: sessionDate, sets, completedAt: new Date().toISOString() },
    };
    persistHistory(newHistory);
    setSessionComplete(true);
    showToast("✅ Session saved!");
  }

  function getLastSession(day: string): Session | null {
    const keys = Object.keys(history)
      .filter((k) => k.startsWith(`session:${day}:`))
      .sort()
      .reverse();
    return keys.length ? history[keys[0]] : null;
  }

  function getLastWeight(day: string, exIdx: number): string | null {
    const last = getLastSession(day);
    if (!last) return null;
    const exSets = last.sets[exIdx];
    if (!exSets) return null;
    const weights = exSets.filter((s) => s.weight).map((s) => s.weight);
    return weights.length ? weights[weights.length - 1] : null;
  }

  function getAllSessions(): Session[] {
    return Object.values(history).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }

  const done = countDoneSets();
  const total = countTotalSets();
  const progress = total ? Math.round((done / total) * 100) : 0;

  // ── HOME ──
  if (view === "home") {
    const allSessions = getAllSessions();
    return (
      <div style={{ background: "#0F0F13", minHeight: "100dvh", fontFamily: "'Inter', system-ui, sans-serif", color: "#F9FAFB", paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1F2937", color: "#F9FAFB", padding: "10px 20px", borderRadius: 10, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {toast}
          </div>
        )}
        <div style={{ padding: "40px 20px 20px", paddingTop: "max(40px, calc(env(safe-area-inset-top) + 20px))", borderBottom: "1px solid #1F2937" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>Anthony's Gym</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>Workout Tracker</h1>
          <p style={{ margin: "6px 0 0", color: "#9CA3AF", fontSize: 14 }}>4-Day Upper / Lower Split</p>
        </div>

        <div style={{ display: "flex", gap: 12, padding: "16px 20px", background: "#141419", borderBottom: "1px solid #1F2937" }}>
          {[
            { label: "Sessions", value: allSessions.length },
            { label: "This week", value: allSessions.filter((s) => new Date(s.completedAt) > new Date(Date.now() - 7 * 86400000)).length },
            { label: "Days trained", value: new Set(allSessions.map((s) => s.date)).size },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, background: "#1A1A22", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#6B7280", textTransform: "uppercase", marginBottom: 14 }}>Choose today's session</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DAYS.map((day) => {
              const plan = WORKOUT_PLAN[day];
              const last = getLastSession(day);
              return (
                <button
                  key={day}
                  onClick={() => startWorkout(day)}
                  style={{ background: "#141419", border: "1px solid #1F2937", borderLeft: `4px solid ${plan.color}`, borderRadius: 12, padding: "16px 18px", textAlign: "left", cursor: "pointer", color: "#F9FAFB", display: "flex", alignItems: "center", gap: 14, fontFamily: "inherit" }}
                >
                  <span style={{ fontSize: 28 }}>{plan.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.label}</div>
                    <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 2 }}>{plan.subtitle} · {plan.exercises.length} exercises</div>
                    {last && <div style={{ color: "#6B7280", fontSize: 12, marginTop: 4 }}>Last: {formatDate(last.date)}</div>}
                  </div>
                  <span style={{ color: "#6B7280", fontSize: 20 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>

        {allSessions.length > 0 && (
          <div style={{ padding: "0 20px" }}>
            <button onClick={() => setView("history")} style={{ width: "100%", background: "#1A1A22", border: "1px solid #1F2937", borderRadius: 12, padding: "14px", color: "#9CA3AF", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              View session history →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── WORKOUT ──
  if (view === "workout" && activeDay) {
    const plan = WORKOUT_PLAN[activeDay];
    return (
      <div style={{ background: "#0F0F13", minHeight: "100dvh", fontFamily: "'Inter', system-ui, sans-serif", color: "#F9FAFB", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1F2937", color: "#F9FAFB", padding: "10px 20px", borderRadius: 10, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            {toast}
          </div>
        )}

        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0F0F13", borderBottom: "1px solid #1F2937", padding: "16px 20px", paddingTop: "max(16px, calc(env(safe-area-inset-top) + 8px))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 0, fontSize: 22 }}>←</button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{plan.emoji} {plan.label}</div>
              <div style={{ color: "#9CA3AF", fontSize: 13 }}>{plan.subtitle} · {formatDate(sessionDate)}</div>
            </div>
          </div>
          <div style={{ background: "#1F2937", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: plan.color, borderRadius: 99, transition: "width 0.3s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{done} / {total} sets done</span>
            <span style={{ fontSize: 12, color: plan.color, fontWeight: 700 }}>{progress}%</span>
          </div>
        </div>

        {sessionComplete ? (
          <div style={{ textAlign: "center", padding: "60px 30px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Session complete!</h2>
            <p style={{ color: "#9CA3AF", margin: "0 0 32px" }}>Great work. Session saved.</p>
            <button onClick={() => setView("home")} style={{ background: plan.color, border: "none", borderRadius: 12, padding: "14px 32px", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit" }}>
              Back to home
            </button>
          </div>
        ) : (
          <div style={{ padding: "16px 20px" }}>
            {plan.exercises.map((ex, exIdx) => {
              const exSets = sets[exIdx] || [];
              const allDone = exSets.length > 0 && exSets.every((s) => s.done);
              const lastW = getLastWeight(activeDay, exIdx);
              return (
                <div key={exIdx} style={{ background: "#141419", border: `1px solid ${allDone ? plan.color + "55" : "#1F2937"}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
                      <div style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                        {ex.sets} sets · {ex.reps} reps
                        {lastW && <span style={{ color: "#9CA3AF" }}> · Last: {lastW}kg</span>}
                      </div>
                    </div>
                    {allDone && <span style={{ fontSize: 18 }}>✅</span>}
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #1F2937" }}>
                    <div style={{ width: 32, fontSize: 11, color: "#6B7280", fontWeight: 600 }}>SET</div>
                    <div style={{ flex: 1, fontSize: 11, color: "#6B7280", fontWeight: 600, textAlign: "center" }}>KG</div>
                    <div style={{ flex: 1, fontSize: 11, color: "#6B7280", fontWeight: 600, textAlign: "center" }}>REPS</div>
                    <div style={{ width: 36 }} />
                  </div>

                  {exSets.map((s, setIdx) => (
                    <div key={setIdx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 32, fontSize: 13, color: s.done ? plan.color : "#6B7280", fontWeight: 700 }}>{setIdx + 1}</div>
                      <input
                        type="number"
                        placeholder="—"
                        value={s.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                        style={{ flex: 1, background: "#0F0F13", border: "1px solid #374151", borderRadius: 8, padding: "8px", color: "#F9FAFB", fontSize: 16, textAlign: "center", fontFamily: "inherit", outline: "none" }}
                      />
                      <input
                        type="number"
                        placeholder="—"
                        value={s.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                        style={{ flex: 1, background: "#0F0F13", border: "1px solid #374151", borderRadius: 8, padding: "8px", color: "#F9FAFB", fontSize: 16, textAlign: "center", fontFamily: "inherit", outline: "none" }}
                      />
                      <button
                        onClick={() => toggleSetDone(exIdx, setIdx)}
                        style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${s.done ? plan.color : "#374151"}`, background: s.done ? plan.color : "transparent", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        {s.done ? "✓" : ""}
                      </button>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => addSet(exIdx)} style={{ flex: 1, background: "none", border: "1px dashed #374151", borderRadius: 8, padding: "7px", color: "#6B7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      + Add set
                    </button>
                    {exSets.length > 1 && (
                      <button onClick={() => removeSet(exIdx)} style={{ background: "none", border: "1px dashed #374151", borderRadius: 8, padding: "7px 12px", color: "#6B7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        – Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button onClick={finishWorkout} style={{ width: "100%", background: plan.color, border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontWeight: 800, fontSize: 17, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>
              Finish session ✓
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── HISTORY ──
  if (view === "history") {
    const allSessions = getAllSessions();
    const filtered = historyFilter === "all" ? allSessions : allSessions.filter((s) => s.day === historyFilter);
    return (
      <div style={{ background: "#0F0F13", minHeight: "100dvh", fontFamily: "'Inter', system-ui, sans-serif", color: "#F9FAFB", paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
        <div style={{ position: "sticky", top: 0, background: "#0F0F13", borderBottom: "1px solid #1F2937", padding: "16px 20px", paddingTop: "max(16px, calc(env(safe-area-inset-top) + 8px))", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 0, fontSize: 22 }}>←</button>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Session History</div>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {["all", ...DAYS].map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                style={{ background: historyFilter === f ? (f === "all" ? "#374151" : WORKOUT_PLAN[f]?.color) : "#141419", border: "1px solid #1F2937", borderRadius: 20, padding: "6px 14px", color: historyFilter === f ? "#fff" : "#9CA3AF", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6B7280" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div>No sessions yet. Get lifting!</div>
            </div>
          ) : (
            filtered.map((session, idx) => {
              const plan = WORKOUT_PLAN[session.day];
              const totalSets = Object.values(session.sets).flat().length;
              const doneSets = Object.values(session.sets).flat().filter((s) => s.done).length;
              return (
                <div key={idx} style={{ background: "#141419", border: "1px solid #1F2937", borderLeft: `4px solid ${plan.color}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.emoji} {session.day}</div>
                      <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 2 }}>{formatDate(session.date)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: plan.color, fontWeight: 700 }}>{doneSets}/{totalSets} sets</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{plan.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {plan.exercises.map((ex, exIdx) => {
                      const exSets = session.sets[exIdx] || [];
                      const weights = exSets.filter((s) => s.weight).map((s) => `${s.weight}kg`);
                      const topWeight = weights.length ? weights[weights.length - 1] : null;
                      return topWeight ? (
                        <span key={exIdx} style={{ background: "#1A1A22", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#9CA3AF" }}>
                          {ex.name.split(" ")[0]}: <span style={{ color: "#F9FAFB", fontWeight: 600 }}>{topWeight}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return null;
}
