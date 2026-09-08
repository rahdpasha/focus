import { useEffect, useMemo, useState } from "react"
import type { Subject, StudySession } from "../types"
import type { AppSettings } from "../app/settings"
import { defaultSettings } from "../app/settings"
import { getWeekKey, type WeeklyGoalMap } from "../utils/goalHistory"
import { localStorageStore } from "../storage/localStorage"
import type { FocusDataStore } from "../storage/types"
import type { TranslationKey } from "../translations"

type Translate = (key: TranslationKey) => string

export function useFocusData(t: Translate, store: FocusDataStore = localStorageStore) {
  const initial = useMemo(() => store.load(), [store])
  const [subjects, setSubjects] = useState<Subject[]>(initial.subjects)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(initial.activeSubjectId)
  const [sessions, setSessions] = useState<StudySession[]>(initial.sessions)
  const [dailyGoal, setDailyGoal] = useState(initial.dailyGoal)
  const [weeklyGoal, setWeeklyGoalState] = useState(initial.weeklyGoal)
  const [weeklyGoalsHistory, setWeeklyGoalsHistory] = useState<WeeklyGoalMap>(initial.weeklyGoalsHistory)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)

  useEffect(() => {
    store.save({ sessions, subjects, dailyGoal, weeklyGoal, weeklyGoalsHistory, activeSubjectId, settings })
  }, [store, sessions, subjects, dailyGoal, weeklyGoal, weeklyGoalsHistory, activeSubjectId, settings])

  const setWeeklyGoal = (goal: number) => {
    if (!Number.isFinite(goal) || goal <= 0) return
    setWeeklyGoalState(goal)
    setWeeklyGoalsHistory((previous) => ({ ...previous, [getWeekKey(new Date())]: goal }))
  }

  const addSession = (session: StudySession) => setSessions((previous) => [session, ...previous])
  const deleteSession = (id: string) => setSessions((previous) => previous.filter((session) => session.id !== id))

  const addSubject = (name: string, color: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const newSubject: Subject = { id: `subject-${Date.now()}`, name: trimmedName, color }
    setSubjects((previous) => [...previous, newSubject])
    setActiveSubjectId(newSubject.id)
  }

  const deleteSubject = (id: string) => {
    setSubjects((previous) => previous.filter((subject) => subject.id !== id))
    setActiveSubjectId((current) => current === id ? null : current)
  }

  const selectSubject = (id: string | null) => setActiveSubjectId(id)
  const updateSettings = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setSettings((previous) => ({ ...previous, [key]: value }))

  const exportData = () => {
    const backup = {
      version: 3,
      exportedAt: new Date().toISOString(),
      sessions, subjects, dailyGoal, weeklyGoal, weeklyGoalsHistory, settings, activeSubjectId,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `focus-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const backup: unknown = JSON.parse(String(reader.result))
        if (!backup || typeof backup !== "object" || Array.isArray(backup)) throw new Error("Invalid backup")
        const data = backup as Record<string, unknown>
        if (!Array.isArray(data.sessions)) throw new Error("Invalid sessions")
        if (!Array.isArray(data.subjects)) throw new Error("Invalid subjects")
        const importedSessions: StudySession[] = data.sessions.map((session: StudySession) => ({ ...session, completedAt: new Date(session.completedAt), totalPausedSeconds: session.totalPausedSeconds ?? 0 }))
        setSessions(importedSessions); setSubjects(data.subjects as Subject[])
        if (typeof data.dailyGoal === "number" && data.dailyGoal > 0) setDailyGoal(data.dailyGoal)
        if (typeof data.weeklyGoal === "number" && data.weeklyGoal > 0) setWeeklyGoal(data.weeklyGoal)
        if (data.weeklyGoalsHistory && typeof data.weeklyGoalsHistory === "object" && !Array.isArray(data.weeklyGoalsHistory)) {
          const importedWeeklyGoals: WeeklyGoalMap = {}
          Object.entries(data.weeklyGoalsHistory as Record<string, unknown>).forEach(([weekKey, value]) => {
            if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return
            const parsedDate = new Date(`${weekKey}T00:00:00`)
            if (!Number.isNaN(parsedDate.getTime()) && parsedDate.getDay() === 0) { parsedDate.setDate(parsedDate.getDate() + 1); importedWeeklyGoals[getWeekKey(parsedDate)] = value }
            else importedWeeklyGoals[weekKey] = value
          })
          setWeeklyGoalsHistory(importedWeeklyGoals)
        } else if (typeof data.weeklyGoal === "number" && data.weeklyGoal > 0) setWeeklyGoalsHistory({ [getWeekKey(new Date())]: data.weeklyGoal })
        else setWeeklyGoalsHistory({})
        if (data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) setSettings({ ...defaultSettings, ...(data.settings as Partial<AppSettings>) })
        if (typeof data.activeSubjectId === "string" || data.activeSubjectId === null) setActiveSubjectId(data.activeSubjectId)
        alert(t("dataImported"))
      } catch { alert(t("invalidBackup")) }
    }
    reader.onerror = () => alert(t("backupReadFailed"))
    reader.readAsText(file)
  }

  return { subjects, activeSubjectId, sessions, dailyGoal, weeklyGoal, weeklyGoalsHistory, settings, setDailyGoal, setWeeklyGoal, setSettings, updateSettings, addSession, deleteSession, addSubject, deleteSubject, selectSubject, exportData, importData }
}
