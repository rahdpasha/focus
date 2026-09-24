import { useMemo, useState } from "react"
import type { Subject, StudySession } from "../types"
import type { AdvancedGoal } from "../storage/types"
import { getAdvancedGoalProgress } from "../utils/advancedGoals"
import { useI18n } from "../useI18n"
import { getStudyPlan } from "../utils/studyPlan"
import PageContainer from "./PageContainer"
import PageHeader from "../components/layout/PageHeader"

interface StudyPlanPageProps {
  sessions: StudySession[]
  subjects: Subject[]
  weeklyGoal: number
  dailyGoal: number
  advancedGoals: AdvancedGoal[]
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
  onAddAdvancedGoal: (
    title: string,
    targetMinutes: number,
    deadline: string,
    priority: AdvancedGoal["priority"],
  ) => void
  onUpdateAdvancedGoal: (
    id: string,
    patch: Partial<Omit<AdvancedGoal, "id" | "createdAt">>,
  ) => void
  onDeleteAdvancedGoal: (id: string) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
  ) => void
}

export default function StudyPlanPage({
  sessions,
  subjects,
  weeklyGoal,
  dailyGoal,
  advancedGoals,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onAddAdvancedGoal,
  onUpdateAdvancedGoal,
  onDeleteAdvancedGoal,
  onStartSession,
}: StudyPlanPageProps) {
  const { t } = useI18n()
  const [goalTitle, setGoalTitle] = useState("")
  const [goalTarget, setGoalTarget] = useState(300)
  const [goalDeadline, setGoalDeadline] = useState("")
  const [goalPriority, setGoalPriority] =
    useState<AdvancedGoal["priority"]>("medium")

  const advancedGoalCards = useMemo(
    () =>
      advancedGoals
        .map((goal) => ({
          goal,
          progress: getAdvancedGoalProgress(goal, sessions),
        }))
        .sort((a, b) => {
          if (a.progress.completed !== b.progress.completed) {
            return a.progress.completed ? 1 : -1
          }

          if (a.progress.overdue !== b.progress.overdue) {
            return a.progress.overdue ? -1 : 1
          }

          const priorityWeight = {
            high: 3,
            medium: 2,
            low: 1,
          }

          const priorityDifference =
            priorityWeight[b.goal.priority] -
            priorityWeight[a.goal.priority]

          if (priorityDifference !== 0) {
            return priorityDifference
          }

          return (
            new Date(a.goal.deadline).getTime() -
            new Date(b.goal.deadline).getTime()
          )
        }),
    [advancedGoals, sessions],
  )

  const createAdvancedGoal = () => {
    if (!goalTitle.trim() || !goalDeadline) return

    onAddAdvancedGoal(
      goalTitle,
      goalTarget,
      goalDeadline,
      goalPriority,
    )

    setGoalTitle("")
    setGoalTarget(300)
    setGoalDeadline("")
    setGoalPriority("medium")
  }

  const plan = getStudyPlan(sessions, subjects, weeklyGoal, dailyGoal)

  const dailyPercent = Math.min(100, Math.round((plan.todayCompletedMinutes / dailyGoal) * 100))
  const weeklyPercent = Math.min(100, Math.round((plan.weeklyCompletedMinutes / weeklyGoal) * 100))

  return (
    <PageContainer>
      <PageHeader title={t("studyPlan")} description={t("studyPlanPageQuestion")} />

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {/* Today Card */}
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.08em", fontWeight: 600 }}>TODAY</span>
            <span className="mono" style={{ color: "var(--primary-glow)", fontSize: "12px" }}>{dailyPercent}%</span>
          </div>
          <div className="mono" style={{ fontSize: "22px", color: "var(--text-primary)", margin: "10px 0 4px 0" }}>
            {plan.todayCompletedMinutes}m <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/ {dailyGoal}m</span>
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: "var(--void-border)", overflow: "hidden", margin: "10px 0" }}>
            <div style={{ width: `${dailyPercent}%`, height: "100%", background: "var(--primary-glow)", transition: "width 300ms ease" }} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {plan.todayRemainingMinutes > 0 ? `${plan.todayRemainingMinutes}m remaining today` : "🎉 Daily target achieved!"}
          </div>
        </div>

        {/* Weekly Card */}
        <div className="glass-panel" style={{ padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.08em", fontWeight: 600 }}>THIS WEEK</span>
            <span className="mono" style={{ color: "var(--primary-glow)", fontSize: "12px" }}>{weeklyPercent}%</span>
          </div>
          <div className="mono" style={{ fontSize: "22px", color: "var(--text-primary)", margin: "10px 0 4px 0" }}>
            {Math.round(plan.weeklyCompletedMinutes / 60 * 10) / 10}h <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/ {Math.round(weeklyGoal / 60)}h</span>
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: "var(--void-border)", overflow: "hidden", margin: "10px 0" }}>
            <div style={{ width: `${weeklyPercent}%`, height: "100%", background: "var(--primary-glow)", transition: "width 300ms ease" }} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {plan.weeklyRemainingMinutes > 0 ? `${Math.round(plan.weeklyRemainingMinutes / 60 * 10) / 10}h remaining this week` : "🎉 Weekly target achieved!"}
          </div>
        </div>
      </div>

      {/* Today's Action Plan */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ color: "var(--primary-glow)", fontFamily: "Orbitron, sans-serif", fontSize: "12px", letterSpacing: "0.08em" }}>
            TODAY'S ACTION PLAN
          </div>
          {plan.bestTime && (
            <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Best time: <span style={{ color: "var(--text-primary)" }}>{plan.bestTime}</span>
            </div>
          )}
        </div>

        {/* Rationale Banner */}
        <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--void-border)", background: "var(--void-surface-hover)", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600 }}>WHY THIS PLAN</span>
            <span style={{ color: "var(--primary-glow)", fontSize: "10px", textTransform: "uppercase", fontWeight: 600 }}>{plan.priority} PRIORITY</span>
          </div>
          <div style={{ color: "var(--text-primary)", fontSize: "12px", marginTop: "6px", lineHeight: 1.5 }}>
            {plan.rationale}
          </div>
        </div>

        {/* Action Items List */}
        <div style={{ display: "grid", gap: "10px" }}>
          {plan.items.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "12px", textAlign: "center" }}>
              No subjects available. Add subjects to generate your study plan.
            </div>
          ) : (
            plan.items.map((item, index) => (
              <div
                key={`${item.subjectId}-${index}`}
                className="study-plan-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--void-border)",
                  background: "var(--void-surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: item.subjectColor || "var(--primary-glow)",
                      boxShadow: `0 0 8px ${item.subjectColor || "var(--primary-glow)"}`,
                    }}
                  />
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>
                      {item.subjectName}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "3px" }}>
                      {item.reason}
                    </div>
                  </div>
                </div>

                <div className="study-plan-action">
                  <div>
                    <div className="mono" style={{ color: "var(--primary-glow)", fontSize: "15px", fontWeight: 600 }}>
                      {item.minutes}m
                    </div>
                    {item.todayCompletedMinutes > 0 && (
                      <div style={{ color: "var(--text-muted)", fontSize: "10px", marginTop: "2px" }}>
                        {item.todayCompletedMinutes}m done today
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="study-plan-start"
                    onClick={() =>
                      onStartSession(
                        item.subjectId,
                        item.minutes,
                      )
                    }
                  >
                    START
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subject Allocation Grid */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ color: "var(--primary-glow)", fontFamily: "Orbitron, sans-serif", fontSize: "12px", letterSpacing: "0.08em", marginBottom: "16px" }}>
          WEEKLY SUBJECT ALLOCATION
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {plan.subjectAllocations.map((sa) => (
            <div
              key={sa.subjectId}
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid var(--void-border)",
                background: "var(--void-surface-hover)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sa.subjectColor || "var(--primary-glow)" }} />
                  <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>{sa.subjectName}</span>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: sa.status === "needs_attention" ? "rgba(239, 68, 68, 0.15)" : sa.status === "completed" ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: sa.status === "needs_attention" ? "#ef4444" : sa.status === "completed" ? "#22c55e" : "var(--text-muted)",
                    border: `1px solid ${sa.status === "needs_attention" ? "rgba(239, 68, 68, 0.3)" : sa.status === "completed" ? "rgba(34, 197, 94, 0.3)" : "var(--void-border)"}`,
                  }}
                >
                  {sa.status === "needs_attention" ? "Behind" : sa.status === "completed" ? "Done" : "On Track"}
                </span>
              </div>

              <div className="mono" style={{ color: "var(--text-primary)", fontSize: "16px", marginTop: "10px" }}>
                {sa.completedMinutesThisWeek}m <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>/ {sa.targetMinutes}m</span>
              </div>

              <div style={{ height: "4px", borderRadius: "999px", background: "var(--void-border)", overflow: "hidden", margin: "8px 0" }}>
                <div style={{ width: `${sa.percent}%`, height: "100%", background: sa.subjectColor || "var(--primary-glow)", transition: "width 300ms ease" }} />
              </div>

              <div className="subject-allocation-footer">
                <span>
                  {sa.remainingMinutes > 0 ? `${sa.remainingMinutes}m left this week` : "Target met"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onStartSession(
                      sa.subjectId,
                      25,
                    )
                  }
                >
                  25M
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel advanced-goals-panel">
        <div className="advanced-goals-header">
          <div>
            <div className="eyebrow">Advanced goals</div>
            <h2>Targets with a deadline</h2>
            <p>
              Track a focused objective across multiple sessions without turning the plan into a to-do list.
            </p>
          </div>
          <span className="mono">
            {advancedGoals.filter((goal) => goal.status === "active").length} active ·{" "}
            {advancedGoalCards.filter(({ progress }) => progress.overdue).length} overdue
          </span>
        </div>

        <div className="advanced-goal-create">
          <input
            aria-label="Goal title"
            value={goalTitle}
            maxLength={80}
            onChange={(event) => setGoalTitle(event.target.value)}
            placeholder="Example: 10 hours of Operating Systems"
          />

          <input
            type="number"
            min={30}
            max={10000}
            step={30}
            value={goalTarget}
            onChange={(event) => setGoalTarget(Number(event.target.value))}
            aria-label="Target minutes"
          />

          <input
            type="datetime-local"
            value={goalDeadline}
            onChange={(event) => setGoalDeadline(event.target.value)}
            aria-label="Goal deadline"
          />

          <select
            aria-label="Goal priority"
            value={goalPriority}
            onChange={(event) =>
              setGoalPriority(event.target.value as AdvancedGoal["priority"])
            }
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>

          <button
            type="button"
            className="cyber-btn"
            disabled={!goalTitle.trim() || !goalDeadline}
            onClick={createAdvancedGoal}
          >
            ADD GOAL
          </button>
        </div>

        <div className="advanced-goal-list">
          {advancedGoalCards.length === 0 ? (
            <div className="advanced-goal-empty">
              No deadline goals yet. Your daily and weekly targets still work normally.
            </div>
          ) : (
            advancedGoalCards.map(({ goal, progress }) => (
              <article
                key={goal.id}
                className={
                  progress.overdue
                    ? "advanced-goal-card overdue"
                    : progress.completed
                      ? "advanced-goal-card complete"
                      : "advanced-goal-card"
                }
              >
                <div className="advanced-goal-topline">
                  <div>
                    <span className={`advanced-goal-priority ${goal.priority}`}>
                      {goal.priority}
                    </span>
                    <h3>{goal.title}</h3>
                  </div>

                  <div className="advanced-goal-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAdvancedGoal(goal.id, {
                          status:
                            goal.status === "completed"
                              ? "active"
                              : "completed",
                        })
                      }
                    >
                      {goal.status === "completed" ? "REOPEN" : "COMPLETE"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAdvancedGoal(goal.id)}
                    >
                      DELETE
                    </button>
                  </div>
                </div>

                <div className="advanced-goal-progress-row">
                  <span className="mono">
                    {progress.minutes}m / {progress.targetMinutes}m
                  </span>
                  <span>
                    {progress.completed
                      ? "Completed"
                      : progress.overdue
                        ? "Overdue"
                        : `${progress.remainingMinutes}m remaining`}
                  </span>
                </div>

                <div className="advanced-goal-track">
                  <div
                    className="advanced-goal-fill"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                <div className="advanced-goal-footer">
                  <span>{progress.percent}%</span>
                  <span>
                    Due {new Date(goal.deadline).toLocaleString()}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Target Controls */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ color: "var(--primary-glow)", fontFamily: "Orbitron, sans-serif", fontSize: "12px", letterSpacing: "0.08em", marginBottom: "14px" }}>
          PLANNING TARGETS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          <label style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Daily Focus Target
            <select
              value={dailyGoal}
              onChange={(e) => onDailyGoalChange(Number(e.target.value))}
              style={{
                display: "block",
                marginTop: "6px",
                width: "100%",
                padding: "10px",
                background: "var(--void-surface-hover)",
                border: "1px solid var(--void-border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            >
              <option value={30}>30m / day</option>
              <option value={60}>1h / day</option>
              <option value={90}>1.5h / day</option>
              <option value={120}>2h / day</option>
              <option value={180}>3h / day</option>
              <option value={240}>4h / day</option>
            </select>
          </label>

          <label style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Weekly Focus Target
            <select
              value={weeklyGoal}
              onChange={(e) => onWeeklyGoalChange(Number(e.target.value))}
              style={{
                display: "block",
                marginTop: "6px",
                width: "100%",
                padding: "10px",
                background: "var(--void-surface-hover)",
                border: "1px solid var(--void-border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            >
              <option value={300}>5h / week</option>
              <option value={600}>10h / week</option>
              <option value={900}>15h / week</option>
              <option value={1200}>20h / week</option>
              <option value={1500}>25h / week</option>
              <option value={1800}>30h / week</option>
            </select>
          </label>
        </div>
      </div>
    </PageContainer>
  )
}
