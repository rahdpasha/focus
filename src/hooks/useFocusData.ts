import { useEffect, useMemo, useRef, useState } from "react"
import type { Subject, StudySession } from "../types"
import type { AppSettings } from "../app/settings"
import { normalizeSettings } from "../app/settings"
import { getWeekKey, type WeeklyGoalMap } from "../utils/goalHistory"
import { createSubject } from "../utils/subjectManager"
import { localStorageStore } from "../storage/localStorage"
import type { FocusDataSnapshot, FocusDataStore } from "../storage/types"
import type { TranslationKey } from "../translations"
import { supabase } from "../api/supabaseClient"
import type { AuthSession } from "../auth/types"
import {
  deleteSupabaseSession,
  deleteSupabaseSubject,
  loadSupabaseSnapshot,
  saveSupabaseSnapshot,
} from "../storage/supabaseStore"

type Translate = (key: TranslationKey) => string

function getCloudFingerprint(
  snapshot: FocusDataSnapshot,
): string {
  return JSON.stringify({
    sessions: snapshot.sessions,
    subjects: snapshot.subjects,
    dailyGoal: snapshot.dailyGoal,
    weeklyGoal: snapshot.weeklyGoal,
    weeklyGoalsHistory: snapshot.weeklyGoalsHistory,
    settings: snapshot.settings,
  })
}

export function useFocusData(
  t: Translate,
  store: FocusDataStore = localStorageStore,
  authSession: AuthSession | null = null,
) {
  const initial = useMemo(() => store.load(), [store])
  const [subjects, setSubjects] = useState<Subject[]>(initial.subjects)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(initial.activeSubjectId)
  const [sessions, setSessions] = useState<StudySession[]>(initial.sessions)
  const [dailyGoal, setDailyGoal] = useState(initial.dailyGoal)
  const [weeklyGoal, setWeeklyGoalState] = useState(initial.weeklyGoal)
  const [weeklyGoalsHistory, setWeeklyGoalsHistory] = useState<WeeklyGoalMap>(initial.weeklyGoalsHistory)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)
  const cloudHydrated = useRef(false)
  const [cloudReady, setCloudReady] = useState(false)
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudHydrationStarted = useRef(false)
  const cloudSaveInFlight = useRef(false)
  const queuedCloudSnapshot = useRef<typeof initial | null>(null)
  const lastCloudFingerprint = useRef<string | null>(null)

  useEffect(() => {
    store.save({
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      activeSubjectId,
      settings,
    })
  }, [
    store,
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
    weeklyGoalsHistory,
    activeSubjectId,
    settings,
  ])

  useEffect(() => {
    if (!authSession || cloudHydrationStarted.current) return

    cloudHydrationStarted.current = true

    void (async () => {
      try {
        const cloudSnapshot = await loadSupabaseSnapshot(
          authSession.user.id,
        )

        const cloudHasData =
          cloudSnapshot.subjects.length > 0 ||
          cloudSnapshot.sessions.length > 0 ||
          Object.keys(
            cloudSnapshot.weeklyGoalsHistory,
          ).length > 0

        const localHasData =
          initial.subjects.length > 0 ||
          initial.sessions.length > 0 ||
          Object.keys(
            initial.weeklyGoalsHistory,
          ).length > 0

        if (!cloudHasData && localHasData) {
          await saveSupabaseSnapshot(
            initial,
            authSession.user.id,
          )

          lastCloudFingerprint.current =
            getCloudFingerprint(initial)

          cloudHydrated.current = true
          setCloudReady(true)
          return
        }

        setSubjects(cloudSnapshot.subjects)
        setActiveSubjectId((current) => {
          const currentStillExists =
            current !== null &&
            cloudSnapshot.subjects.some(
              (subject) => subject.id === current,
            )

          return currentStillExists
            ? current
            : cloudSnapshot.activeSubjectId
        })
        

        setSessions(cloudSnapshot.sessions)
        setDailyGoal(cloudSnapshot.dailyGoal)
        setWeeklyGoalState(
          cloudSnapshot.weeklyGoal,
        )
        setWeeklyGoalsHistory(
          cloudSnapshot.weeklyGoalsHistory,
        )
        setSettings(cloudSnapshot.settings)

        lastCloudFingerprint.current =
          getCloudFingerprint(cloudSnapshot)

        cloudHydrated.current = true
        setCloudReady(true)
      } catch (error) {
        console.error(
          "FOCUS cloud hydration failed:",
          error,
        )

        cloudHydrated.current = true
      }
    })()
  }, [initial, authSession])

  useEffect(() => {
    if (!authSession || !cloudHydrated.current) return

    const snapshot = {
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      activeSubjectId,
      settings,
    }

    const fingerprint = getCloudFingerprint(snapshot)

    

    if (
      fingerprint ===
      lastCloudFingerprint.current
    ) {
      return
    }

    queuedCloudSnapshot.current = snapshot

    if (cloudSaveTimer.current) {
      clearTimeout(cloudSaveTimer.current)
    }

    cloudSaveTimer.current = setTimeout(() => {
      const saveLatest = async () => {
        if (
          cloudSaveInFlight.current ||
          !queuedCloudSnapshot.current
        ) {
          return
        }

        cloudSaveInFlight.current = true

        const latestSnapshot =
          queuedCloudSnapshot.current

        queuedCloudSnapshot.current = null

        try {
          

          await saveSupabaseSnapshot(
            latestSnapshot,
            authSession.user.id,
          )

          

          lastCloudFingerprint.current =
            getCloudFingerprint(latestSnapshot)
        } catch (error) {
          console.error(
            "FOCUS cloud save failed:",
            error,
          )

          queuedCloudSnapshot.current =
            latestSnapshot
        } finally {
          cloudSaveInFlight.current = false

          if (queuedCloudSnapshot.current) {
            const nextSnapshot =
              queuedCloudSnapshot.current

            queuedCloudSnapshot.current = null

            try {
              await saveSupabaseSnapshot(
                nextSnapshot,
                authSession.user.id,
              )

              lastCloudFingerprint.current = getCloudFingerprint(nextSnapshot)
            } catch (error) {
              console.error(
                "FOCUS cloud retry failed:",
                error,
              )

              queuedCloudSnapshot.current =
                nextSnapshot
            }
          }
        }
      }

      void saveLatest()
    }, 800)

    return () => {
      if (cloudSaveTimer.current) {
        clearTimeout(cloudSaveTimer.current)
      }
    }
  }, [
    authSession,
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
    weeklyGoalsHistory,
    activeSubjectId,
    settings,
  ])

  const setWeeklyGoal = (goal: number) => {
    if (!Number.isFinite(goal) || goal <= 0) return
    setWeeklyGoalState(goal)
    setWeeklyGoalsHistory((previous) => ({ ...previous, [getWeekKey(new Date())]: goal }))
  }

  const addSession = (session: StudySession) => {
    setSessions((previous) => [session, ...previous])
  }

  const deleteSession = (id: string) => {
    const removeLocal = () => {
      setSessions((previous) =>
        previous.filter(
          (session) => session.id !== id,
        ),
      )
    }

    if (authSession) {
      void deleteSupabaseSession(
        authSession.user.id,
        id,
      )
        .then(removeLocal)
        .catch((error) => {
          console.error(
            "FOCUS session delete failed:",
            error,
          )
        })

      return
    }

    removeLocal()
  }

  const addSubject = (name: string, color: string) => {
    setSubjects((previous) => {
      const newSubject = createSubject(previous, name, color)
      if (!newSubject) return previous
      setActiveSubjectId(newSubject.id)
      return [...previous, newSubject]
    })
  }

  const deleteSubject = (id: string) => {
    const removeLocal = () => {
      setSubjects((previous) =>
        previous.filter(
          (subject) => subject.id !== id,
        ),
      )

      setSessions((previous) =>
        previous.filter(
          (session) =>
            session.subjectId !== id,
        ),
      )

      setActiveSubjectId(
        (current) =>
          current === id ? null : current,
      )
    }

    if (authSession) {
      void deleteSupabaseSubject(
        authSession.user.id,
        id,
      )
        .then(removeLocal)
        .catch((error) => {
          console.error(
            "FOCUS subject delete failed:",
            error,
          )
        })

      return
    }

    removeLocal()
  }

  const selectSubject = (id: string | null) => setActiveSubjectId(id)
  const updateSettings = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setSettings((previous) => normalizeSettings({ ...previous, [key]: value }))

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
        if (data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) setSettings(normalizeSettings(data.settings as Partial<AppSettings>))
        if (typeof data.activeSubjectId === "string" || data.activeSubjectId === null) setActiveSubjectId(data.activeSubjectId)
        alert(t("dataImported"))
      } catch { alert(t("invalidBackup")) }
    }
    reader.onerror = () => alert(t("backupReadFailed"))
    reader.readAsText(file)
  }

  const userId = authSession?.user.id

  useEffect(() => {
    console.error(
      "FOCUS REALTIME EFFECT:",
      "supabase=",
      Boolean(supabase),
      "auth=",
      Boolean(userId),
      "cloudReady=",
      cloudReady,
      "user=",
      userId ?? "none",
    )

    if (!supabase || !userId || !cloudReady) {
      console.error(
        "FOCUS REALTIME BLOCKED:",
        !supabase ? "NO SUPABASE" : "",
        !userId ? "NO AUTH" : "",
        !cloudReady ? "CLOUD NOT READY" : "",
      )
      return
    }

    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let refreshing = false

    const refreshFromCloud = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = setTimeout(() => {
        if (refreshing) {
          return
        }

        refreshing = true

        void loadSupabaseSnapshot(userId)
          .then((cloudSnapshot) => {
            const fingerprint = getCloudFingerprint(cloudSnapshot)

            if (
              fingerprint ===
              lastCloudFingerprint.current
            ) {
              return
            }

            setSubjects(cloudSnapshot.subjects)
            setActiveSubjectId((current) => {
              const currentStillExists =
                current !== null &&
                cloudSnapshot.subjects.some(
                  (subject) => subject.id === current,
                )

              return currentStillExists
                ? current
                : cloudSnapshot.activeSubjectId
            })
            

            setSessions(cloudSnapshot.sessions)
            setDailyGoal(cloudSnapshot.dailyGoal)
            setWeeklyGoalState(
              cloudSnapshot.weeklyGoal,
            )
            setWeeklyGoalsHistory(
              cloudSnapshot.weeklyGoalsHistory,
            )
            setSettings(cloudSnapshot.settings)

            lastCloudFingerprint.current =
              fingerprint
          })
          .catch((error) => {
            console.error(
              "FOCUS realtime refresh failed:",
              error,
            )
          })
          .finally(() => {
            refreshing = false
          })
      }, 300)
    }

    

    const channel = supabase
      .channel(
        `focus-sync-${userId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subjects",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_goal_history",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .subscribe((status, error) => {
        

        if (status === "CHANNEL_ERROR") {
          console.error(
            "FOCUS realtime channel error:",
            error,
          )
        }

        if (status === "TIMED_OUT") {
          console.error(
            "FOCUS realtime channel timed out:",
            error,
          )
        }
      })

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      if (supabase) void supabase.removeChannel(channel)
    }
  }, [userId, cloudReady])

  return { subjects, activeSubjectId, sessions, dailyGoal, weeklyGoal, weeklyGoalsHistory, settings, setDailyGoal, setWeeklyGoal, setSettings, updateSettings, addSession, deleteSession, addSubject, deleteSubject, selectSubject, exportData, importData }
}
