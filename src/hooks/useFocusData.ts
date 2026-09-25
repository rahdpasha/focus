import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Subject, StudySession } from "../types"
import type { AppSettings } from "../app/settings"
import { defaultSettings, normalizeSettings } from "../app/settings"
import { subjects as defaultSubjects } from "../data/subjects"
import { getWeekKey, type WeeklyGoalMap } from "../utils/goalHistory"
import { createSubject, normalizeSubjectName } from "../utils/subjectManager"
import {
  loadAccountSnapshot,
  localStorageStore,
  saveAccountSnapshot,
} from "../storage/localStorage"
import type { AdvancedGoal, CloudSyncStatus, FocusDataSnapshot, FocusDataStore, RoutineItem } from "../storage/types"
import {
  addOfflineMutationId,
  clearOfflineMutationState,
  cloneOfflineMutationState,
  createOfflineMutationState,
  hasOfflineMutations,
  loadOfflineMutationState,
  mergeOfflineMutations,
  removeOfflineMutationId,
  saveOfflineMutationState,
  type OfflineMutationState,
} from "../storage/offlineSync"
import type { TranslationKey } from "../translations"
import { supabase } from "../api/supabaseClient"
import type { AuthSession } from "../auth/types"
import {
  deleteSupabaseAdvancedGoal,
  deleteSupabaseRoutineItem,
  deleteSupabaseSession,
  deleteSupabaseSubject,
  loadSupabaseSnapshot,
  replaceSupabaseSnapshot,
  saveSupabaseMutations,
  saveSupabaseSnapshot,
} from "../storage/supabaseStore"

type Translate = (key: TranslationKey) => string

const LOCAL_OWNER_KEY = "focus-local-owner-id"

function readLocalOwnerId(): string | null {
  try {
    return localStorage.getItem(LOCAL_OWNER_KEY)
  } catch {
    return null
  }
}

function writeLocalOwnerId(userId: string): void {
  try {
    localStorage.setItem(LOCAL_OWNER_KEY, userId)
  } catch {
    // Local cache ownership is best-effort only.
  }
}

function createFreshSnapshot(): FocusDataSnapshot {
  return {
    sessions: [],
    subjects: defaultSubjects.map((subject) => ({
      ...subject,
    })),
    dailyGoal: 120,
    weeklyGoal: 600,
    weeklyGoalsHistory: {},
    advancedGoals: [],
    routineItems: [],
    activeSubjectId: defaultSubjects[0]?.id ?? null,
    settings: { ...defaultSettings },
    workspacePreferencesVersion: 1,
  }
}

function loadInitialSnapshot(
  store: FocusDataStore,
  userId?: string,
): FocusDataSnapshot {
  const snapshot = store.load()

  if (store !== localStorageStore || !userId) {
    return snapshot
  }

  const ownerId = readLocalOwnerId()

  if (!ownerId || ownerId === userId) {
    return snapshot
  }

  return (
    loadAccountSnapshot(userId) ??
    createFreshSnapshot()
  )
}

function hasMeaningfulCloudData(
  snapshot: FocusDataSnapshot & {
    hasArchivedSubjects?: boolean
  },
): boolean {
  return (
    Boolean(
      snapshot.hasArchivedSubjects,
    ) ||
    snapshot.subjects.length > 0 ||
    snapshot.sessions.length > 0 ||
    Object.keys(
      snapshot.weeklyGoalsHistory,
    ).length > 0 ||
    snapshot.advancedGoals.length > 0 ||
    snapshot.routineItems.length > 0 ||
    snapshot.dailyGoal !== 120 ||
    snapshot.weeklyGoal !== 600 ||
    snapshot.workspacePreferencesVersion > 0 ||
    JSON.stringify(
      snapshot.settings,
    ) !==
      JSON.stringify(
        defaultSettings,
      )
  )
}

function getCloudFingerprint(
  snapshot: FocusDataSnapshot,
): string {
  return JSON.stringify({
    sessions: snapshot.sessions,
    subjects: snapshot.subjects,
    dailyGoal: snapshot.dailyGoal,
    weeklyGoal: snapshot.weeklyGoal,
    weeklyGoalsHistory: snapshot.weeklyGoalsHistory,
    advancedGoals: snapshot.advancedGoals,
    routineItems: snapshot.routineItems,
    settings: snapshot.settings,
    workspacePreferencesVersion:
      snapshot.workspacePreferencesVersion,
  })
}

export function useFocusData(
  t: Translate,
  store: FocusDataStore = localStorageStore,
  authSession: AuthSession | null = null,
) {
  const initial = useMemo(
    () =>
      loadInitialSnapshot(
        store,
        authSession?.user.id,
      ),
    [store, authSession?.user.id],
  )
  const [subjects, setSubjects] = useState<Subject[]>(initial.subjects)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(initial.activeSubjectId)
  const [sessions, setSessions] = useState<StudySession[]>(initial.sessions)
  const [dailyGoal, setDailyGoal] = useState(initial.dailyGoal)
  const [weeklyGoal, setWeeklyGoalState] = useState(initial.weeklyGoal)
  const [weeklyGoalsHistory, setWeeklyGoalsHistory] = useState<WeeklyGoalMap>(initial.weeklyGoalsHistory)
  const [advancedGoals, setAdvancedGoals] = useState<AdvancedGoal[]>(initial.advancedGoals)
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>(initial.routineItems)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)
  const [
    workspacePreferencesVersion,
    setWorkspacePreferencesVersion,
  ] = useState(
    initial.workspacePreferencesVersion,
  )
  const cloudHydrated = useRef(false)
  const [cloudReady, setCloudReady] = useState(false)
  const [cloudStatus, setCloudStatus] =
    useState<CloudSyncStatus>(() =>
      authSession
        ? typeof navigator !== "undefined" &&
          !navigator.onLine
          ? "offline"
          : "loading"
        : "local",
    )
  const [networkRevision, setNetworkRevision] =
    useState(0)
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudHydrationStarted = useRef(false)
  const cloudSaveInFlight = useRef(false)
  const cloudSaveFailed = useRef(false)
  const queuedCloudSnapshot = useRef<typeof initial | null>(null)
  const cloudReplaceRequested = useRef(false)
  const lastCloudFingerprint = useRef<string | null>(null)
  const [
    initialOfflineMutations,
  ] = useState<OfflineMutationState>(
    () =>
      loadOfflineMutationState(
        authSession?.user.id,
      ),
  )
  const offlineMutations =
    useRef<OfflineMutationState>(
      initialOfflineMutations,
    )
  const offlineRecoveryRequested =
    useRef(
      hasOfflineMutations(
        initialOfflineMutations,
      ),
    )
  const latestLocalSnapshot =
    useRef<FocusDataSnapshot>(initial)

  useEffect(() => {
    latestLocalSnapshot.current = {
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      advancedGoals,
      routineItems,
      activeSubjectId,
      settings,
      workspacePreferencesVersion,
    }
  }, [
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
    weeklyGoalsHistory,
    advancedGoals,
    routineItems,
    activeSubjectId,
    settings,
    workspacePreferencesVersion,
  ])

  const recordPendingMutation =
    useCallback(
      (
        update: (
          mutations: OfflineMutationState,
        ) => void,
      ) => {
        if (!authSession) {
          return
        }

        update(
          offlineMutations.current,
        )

        if (
          typeof navigator !== "undefined" &&
          !navigator.onLine
        ) {
          offlineRecoveryRequested.current =
            true
        }

        saveOfflineMutationState(
          authSession.user.id,
          offlineMutations.current,
        )
      },
      [authSession],
    )

  const flushCloudSaveQueue = useCallback(
    async (): Promise<boolean> => {
      if (!authSession) {
        return false
      }

      while (cloudSaveInFlight.current) {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 25)
        })
      }

      if (!queuedCloudSnapshot.current) {
        return true
      }

      cloudSaveInFlight.current = true
      cloudSaveFailed.current = false
      let saveFailed = false
      let lastSavedLocalFingerprint:
        | string
        | null = null

      try {
        while (queuedCloudSnapshot.current) {
          const queuedSnapshot =
            queuedCloudSnapshot.current

          queuedCloudSnapshot.current = null

          const replaceCloud =
            cloudReplaceRequested.current

          if (replaceCloud) {
            cloudReplaceRequested.current =
              false
          }

          const localSnapshot =
            latestLocalSnapshot.current
          const localFingerprint =
            getCloudFingerprint(
              localSnapshot,
            )
          const pendingChanges =
            cloneOfflineMutationState(
              offlineMutations.current,
            )

          try {
            let savedSnapshot =
              queuedSnapshot

            if (replaceCloud) {
              await replaceSupabaseSnapshot(
                localSnapshot,
                authSession.user.id,
              )

              savedSnapshot =
                localSnapshot
            } else if (
              hasOfflineMutations(
                pendingChanges,
              )
            ) {
              const cloudSnapshot =
                await loadSupabaseSnapshot(
                  authSession.user.id,
                )

              const mergedSnapshot =
                mergeOfflineMutations(
                  cloudSnapshot,
                  localSnapshot,
                  pendingChanges,
                )

              await saveSupabaseMutations(
                mergedSnapshot,
                authSession.user.id,
                pendingChanges,
              )

              savedSnapshot =
                mergedSnapshot
            } else {
              lastCloudFingerprint.current =
                getCloudFingerprint(
                  queuedSnapshot,
                )
              lastSavedLocalFingerprint =
                localFingerprint
              continue
            }

            lastCloudFingerprint.current =
              getCloudFingerprint(
                savedSnapshot,
              )
            lastSavedLocalFingerprint =
              localFingerprint
          } catch (error) {
            if (replaceCloud) {
              cloudReplaceRequested.current =
                true
            }

            console.error(
              "FOCUS cloud save failed:",
              error,
            )

            if (!queuedCloudSnapshot.current) {
              queuedCloudSnapshot.current =
                latestLocalSnapshot.current
            }

            saveFailed = true
            cloudSaveFailed.current = true
            setCloudStatus("error")
            break
          }
        }

        if (
          !saveFailed &&
          !queuedCloudSnapshot.current
        ) {
          const currentLocalFingerprint =
            getCloudFingerprint(
              latestLocalSnapshot.current,
            )

          if (
            lastSavedLocalFingerprint ===
              currentLocalFingerprint
          ) {
            offlineMutations.current =
              createOfflineMutationState()
            offlineRecoveryRequested.current =
              false
            clearOfflineMutationState(
              authSession.user.id,
            )
          }

          setCloudStatus(
            hasOfflineMutations(
              offlineMutations.current,
            )
              ? "saving"
              : "synced",
          )
        }

        return !saveFailed
      } finally {
        cloudSaveInFlight.current = false
      }
    },
    [authSession],
  )

  const flushBeforeDestructiveMutation =
    useCallback(async (): Promise<boolean> => {
      if (!authSession) {
        return true
      }

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        return true
      }

      if (!cloudHydrated.current) {
        return true
      }

      if (cloudSaveTimer.current) {
        clearTimeout(cloudSaveTimer.current)
        cloudSaveTimer.current = null
      }

      const latestSnapshot =
        latestLocalSnapshot.current

      if (
        hasOfflineMutations(
          offlineMutations.current,
        )
      ) {
        queuedCloudSnapshot.current =
          latestSnapshot
      }

      if (
        !cloudSaveInFlight.current &&
        !queuedCloudSnapshot.current
      ) {
        return true
      }

      setCloudStatus("saving")
      return flushCloudSaveQueue()
    }, [
      authSession,
      flushCloudSaveQueue,
    ])

  const flushCloudChanges =
    useCallback(async (): Promise<boolean> => {
      if (!authSession) {
        return true
      }

      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        return true
      }

      if (!cloudHydrated.current) {
        return true
      }

      if (cloudSaveTimer.current) {
        clearTimeout(
          cloudSaveTimer.current,
        )
        cloudSaveTimer.current = null
      }

      const latestSnapshot =
        latestLocalSnapshot.current

      if (
        hasOfflineMutations(
          offlineMutations.current,
        )
      ) {
        queuedCloudSnapshot.current =
          latestSnapshot
        setCloudStatus("saving")
      }

      return flushCloudSaveQueue()
    }, [
      authSession,
      flushCloudSaveQueue,
    ])

  useEffect(() => {
    store.save({
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      advancedGoals,
      routineItems,
      activeSubjectId,
      settings,
      workspacePreferencesVersion,
    })

    if (
      authSession &&
      store === localStorageStore
    ) {
      writeLocalOwnerId(
        authSession.user.id,
      )
      saveAccountSnapshot(
        authSession.user.id,
        {
          sessions,
          subjects,
          dailyGoal,
          weeklyGoal,
          weeklyGoalsHistory,
          advancedGoals,
          routineItems,
          activeSubjectId,
          settings,
          workspacePreferencesVersion,
        },
      )
    }
  }, [
    store,
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
    weeklyGoalsHistory,
    advancedGoals,
    routineItems,
    activeSubjectId,
    settings,
    workspacePreferencesVersion,
    authSession,
  ])

  useEffect(() => {
    if (!authSession || cloudHydrationStarted.current) return

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      return
    }

    cloudHydrationStarted.current = true

    void (async () => {
      try {
        const needsMutationRecovery =
          offlineRecoveryRequested.current ||
          hasOfflineMutations(
            offlineMutations.current,
          )

        if (needsMutationRecovery) {
          if (cloudSaveTimer.current) {
            clearTimeout(
              cloudSaveTimer.current,
            )
            cloudSaveTimer.current = null
          }

          queuedCloudSnapshot.current =
            null
          cloudSaveFailed.current =
            false
        } else if (
          queuedCloudSnapshot.current
        ) {
          const flushed =
            await flushCloudSaveQueue()

          if (!flushed) {
            throw new Error(
              "Pending cloud changes could not be saved.",
            )
          }
        }

        let cloudSnapshot =
          await loadSupabaseSnapshot(
            authSession.user.id,
          )

        let cloudHasData =
          hasMeaningfulCloudData(
            cloudSnapshot,
          )

        if (needsMutationRecovery) {
          const localSnapshot =
            latestLocalSnapshot.current
          const offlineChanges =
            offlineMutations.current

          if (
            !offlineChanges.replaceWorkspace
          ) {
            const deletionTasks = [
              ...offlineChanges.deletedSessionIds.map(
                (id) =>
                  deleteSupabaseSession(
                    authSession.user.id,
                    id,
                  ),
              ),
              ...offlineChanges.deletedAdvancedGoalIds.map(
                (id) =>
                  deleteSupabaseAdvancedGoal(
                    authSession.user.id,
                    id,
                  ),
              ),
              ...offlineChanges.deletedRoutineItemIds.map(
                (id) =>
                  deleteSupabaseRoutineItem(
                    authSession.user.id,
                    id,
                  ),
              ),
              ...offlineChanges.deletedSubjectIds.map(
                (id) =>
                  deleteSupabaseSubject(
                    authSession.user.id,
                    id,
                  ),
              ),
            ]

            if (deletionTasks.length > 0) {
              await Promise.all(
                deletionTasks,
              )

              cloudSnapshot =
                await loadSupabaseSnapshot(
                  authSession.user.id,
                )
              cloudHasData =
                hasMeaningfulCloudData(
                  cloudSnapshot,
                )
            }
          }

          if (
            offlineChanges.replaceWorkspace
          ) {
            await replaceSupabaseSnapshot(
              localSnapshot,
              authSession.user.id,
            )
            cloudReplaceRequested.current =
              false
          } else if (!cloudHasData) {
            await saveSupabaseSnapshot(
              localSnapshot,
              authSession.user.id,
            )
          } else if (
            hasOfflineMutations(
              offlineChanges,
            )
          ) {
            const mergedSnapshot =
              mergeOfflineMutations(
                cloudSnapshot,
                localSnapshot,
                offlineChanges,
              )

            await saveSupabaseMutations(
              mergedSnapshot,
              authSession.user.id,
              offlineChanges,
            )
          }

          offlineMutations.current =
            createOfflineMutationState()
          offlineRecoveryRequested.current =
            false
          clearOfflineMutationState(
            authSession.user.id,
          )
          cloudSaveFailed.current =
            false

          cloudSnapshot =
            await loadSupabaseSnapshot(
              authSession.user.id,
            )
          cloudHasData =
            hasMeaningfulCloudData(
              cloudSnapshot,
            )
        }

        const localHasData =
          hasMeaningfulCloudData(
            initial,
          )

        if (!cloudHasData && localHasData) {
          await saveSupabaseSnapshot(
            initial,
            authSession.user.id,
          )

          lastCloudFingerprint.current =
            getCloudFingerprint(initial)

          cloudHydrated.current = true
          setCloudReady(true)
          setCloudStatus("synced")
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
        setAdvancedGoals(cloudSnapshot.advancedGoals)
        setRoutineItems(cloudSnapshot.routineItems)
        const cloudNeedsPreferenceUpgrade =
          cloudSnapshot.workspacePreferencesVersion < 1

        const hydratedSettings =
          cloudNeedsPreferenceUpgrade
            ? {
                ...cloudSnapshot.settings,
                theme:
                  initial.settings.theme,
                language:
                  initial.settings.language,
              }
            : cloudSnapshot.settings

        setSettings(hydratedSettings)
        setWorkspacePreferencesVersion(1)

        if (cloudNeedsPreferenceUpgrade) {
          const upgradedSnapshot = {
            ...cloudSnapshot,
            settings: hydratedSettings,
            workspacePreferencesVersion: 1,
          }

          await saveSupabaseSnapshot(
            upgradedSnapshot,
            authSession.user.id,
          )

          lastCloudFingerprint.current =
            getCloudFingerprint(
              upgradedSnapshot,
            )
        } else {
          lastCloudFingerprint.current =
            getCloudFingerprint(cloudSnapshot)
        }

        cloudHydrated.current = true
        setCloudReady(true)
        setCloudStatus("synced")
        return


      } catch (error) {
        console.error(
          "FOCUS cloud hydration failed:",
          error,
        )

        if (
          typeof navigator !== "undefined" &&
          !navigator.onLine
        ) {
          cloudHydrationStarted.current = false
          cloudHydrated.current = false
          setCloudStatus("offline")
          return
        }

        cloudHydrationStarted.current = false
        cloudHydrated.current = false
        setCloudReady(false)
        setCloudStatus("error")
      }
    })()
  }, [
    initial,
    authSession,
    networkRevision,
    flushCloudSaveQueue,
  ])

  useEffect(() => {
    if (
      !authSession ||
      !cloudHydrated.current
    ) {
      return
    }

    if (
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      return
    }

    const snapshot = {
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      advancedGoals,
      routineItems,
      activeSubjectId,
      settings,
      workspacePreferencesVersion,
    }

    if (
      !hasOfflineMutations(
        offlineMutations.current,
      )
    ) {
      return
    }

    queuedCloudSnapshot.current =
      snapshot
    setCloudStatus("saving")

    if (cloudSaveTimer.current) {
      clearTimeout(
        cloudSaveTimer.current,
      )
    }

    cloudSaveTimer.current =
      setTimeout(() => {
        cloudSaveTimer.current =
          null
        void flushCloudSaveQueue()
      }, 800)

    return () => {
      if (cloudSaveTimer.current) {
        clearTimeout(
          cloudSaveTimer.current,
        )
      }
    }
  }, [
    authSession,
    sessions,
    subjects,
    dailyGoal,
    weeklyGoal,
    weeklyGoalsHistory,
    advancedGoals,
    routineItems,
    activeSubjectId,
    settings,
    workspacePreferencesVersion,
    networkRevision,
    flushCloudSaveQueue,
  ])

  useEffect(() => {
    if (!authSession) {
      return
    }

    const handleOffline = () => {
      setCloudStatus("offline")
    }

    const handleOnline = () => {
      cloudHydrationStarted.current =
        false
      cloudHydrated.current = false
      setCloudReady(false)
      setCloudStatus("loading")
      setNetworkRevision(
        (value) => value + 1,
      )
    }

    window.addEventListener(
      "offline",
      handleOffline,
    )
    window.addEventListener(
      "online",
      handleOnline,
    )

    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener(
        "offline",
        handleOffline,
      )
      window.removeEventListener(
        "online",
        handleOnline,
      )
    }
  }, [authSession])

  const setDailyGoalValue = (
    goal: number,
  ) => {
    if (
      !Number.isFinite(goal) ||
      goal <= 0
    ) {
      return
    }

    setDailyGoal(goal)
    recordPendingMutation(
      (mutations) => {
        mutations.dailyGoal = true
      },
    )
  }

  const setWeeklyGoal = (goal: number) => {
    if (!Number.isFinite(goal) || goal <= 0) return

    const weekKey =
      getWeekKey(new Date())

    setWeeklyGoalState(goal)
    setWeeklyGoalsHistory((previous) => ({
      ...previous,
      [weekKey]: goal,
    }))
    recordPendingMutation(
      (mutations) => {
        mutations.weeklyGoal = true
        addOfflineMutationId(
          mutations.weeklyHistoryKeys,
          weekKey,
        )
      },
    )
  }

  const addSession = (session: StudySession) => {
    setSessions((previous) => [
      session,
      ...previous,
    ])
    recordPendingMutation(
      (mutations) => {
        addOfflineMutationId(
          mutations.sessionIds,
          session.id,
        )
      },
    )
  }

  const deleteSession = (id: string) => {
    const removeLocal = () => {
      setSessions((previous) =>
        previous.filter(
          (session) => session.id !== id,
        ),
      )
    }

    if (
      authSession &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      removeLocal()
      recordPendingMutation(
        (mutations) => {
          removeOfflineMutationId(
            mutations.sessionIds,
            id,
          )
          addOfflineMutationId(
            mutations.deletedSessionIds,
            id,
          )
        },
      )
      setCloudStatus("offline")
      return
    }

    if (authSession) {
      void (async () => {
        const ready =
          await flushBeforeDestructiveMutation()

        if (!ready) {
          return
        }

        await deleteSupabaseSession(
          authSession.user.id,
          id,
        )

        removeLocal()
      })().catch((error) => {
        console.error(
          "FOCUS session delete failed:",
          error,
        )
        setCloudStatus("error")
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
      recordPendingMutation(
        (mutations) => {
          addOfflineMutationId(
            mutations.subjectIds,
            newSubject.id,
          )
        },
      )
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

      setAdvancedGoals((previous) =>
        previous.map((goal) =>
          goal.subjectId === id
            ? {
                ...goal,
                subjectId: undefined,
              }
            : goal,
        ),
      )

      setRoutineItems((previous) =>
        previous.filter(
          (item) =>
            item.subjectId !== id,
        ),
      )

      setActiveSubjectId(
        (current) =>
          current === id ? null : current,
      )
    }

    if (
      authSession &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      removeLocal()
      recordPendingMutation(
        (mutations) => {
          removeOfflineMutationId(
            mutations.subjectIds,
            id,
          )
          addOfflineMutationId(
            mutations.deletedSubjectIds,
            id,
          )
        },
      )
      setCloudStatus("offline")
      return
    }

    if (authSession) {
      void (async () => {
        const ready =
          await flushBeforeDestructiveMutation()

        if (!ready) {
          return
        }

        await deleteSupabaseSubject(
          authSession.user.id,
          id,
        )

        removeLocal()
      })().catch((error) => {
        console.error(
          "FOCUS subject delete failed:",
          error,
        )
        setCloudStatus("error")
      })

      return
    }

    removeLocal()
  }

  const selectSubject = (id: string | null) => setActiveSubjectId(id)
  const updateSettings = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((previous) =>
      normalizeSettings({
        ...previous,
        [key]: value,
      }),
    )
    recordPendingMutation(
      (mutations) => {
        if (
          !mutations.settingsKeys.includes(
            key,
          )
        ) {
          mutations.settingsKeys.push(
            key,
          )
        }
      },
    )
  }

  const addRoutineItem = (
    title: string,
    subjectId: string,
    targetMinutes: number,
    mode: RoutineItem["mode"],
    daysOfWeek: number[] = [0, 1, 2, 3, 4, 5, 6],
    recoveryDays = 1,
  ) => {
    const cleanTitle = title.trim()
    const safeTarget = Math.min(
      720,
      Math.max(
        1,
        Math.round(targetMinutes),
      ),
    )
    const safeDays = Array.from(
      new Set(
        daysOfWeek.filter(
          (day) =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6,
        ),
      ),
    )
    const safeRecoveryDays =
      Math.max(
        0,
        Math.min(
          3,
          Math.round(
            recoveryDays,
          ),
        ),
      )

    if (
      !cleanTitle ||
      !subjects.some(
        (subject) =>
          subject.id === subjectId,
      )
    ) {
      return
    }

    const nextRotationOrder =
      mode === "rotation"
        ? routineItems
            .filter(
              (item) =>
                item.mode === "rotation",
            )
            .reduce(
              (max, item) =>
                Math.max(
                  max,
                  item.rotationOrder,
                ),
              -1,
            ) + 1
        : 0

    const item: RoutineItem = {
      id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      subjectId,
      targetMinutes: safeTarget,
      mode,
      rotationOrder:
        nextRotationOrder,
      daysOfWeek:
        safeDays.length > 0
          ? safeDays
          : [0, 1, 2, 3, 4, 5, 6],
      recoveryDays:
        safeRecoveryDays,
      enabled: true,
      createdAt:
        new Date().toISOString(),
    }

    setRoutineItems(
      (previous) => [
        ...previous,
        item,
      ],
    )

    recordPendingMutation(
      (mutations) => {
        addOfflineMutationId(
          mutations.routineItemIds,
          item.id,
        )
      },
    )
  }

  const updateRoutineItem = (
    id: string,
    patch: Partial<
      Omit<
        RoutineItem,
        "id" | "createdAt"
      >
    >,
  ) => {
    setRoutineItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item
        }

        const title =
          typeof patch.title ===
            "string"
            ? patch.title.trim()
            : item.title
        const subjectId =
          typeof patch.subjectId ===
            "string" &&
          subjects.some(
            (subject) =>
              subject.id ===
              patch.subjectId,
          )
            ? patch.subjectId
            : item.subjectId
        const targetMinutes =
          typeof patch.targetMinutes ===
            "number" &&
          Number.isFinite(
            patch.targetMinutes,
          )
            ? Math.min(
                720,
                Math.max(
                  1,
                  Math.round(
                    patch.targetMinutes,
                  ),
                ),
              )
            : item.targetMinutes

        return {
          ...item,
          ...patch,
          title:
            title || item.title,
          subjectId,
          targetMinutes,
          rotationOrder:
            typeof patch.rotationOrder ===
              "number" &&
            Number.isFinite(
              patch.rotationOrder,
            )
              ? Math.max(
                  0,
                  Math.round(
                    patch.rotationOrder,
                  ),
                )
              : item.rotationOrder,
          daysOfWeek:
            Array.isArray(
              patch.daysOfWeek,
            )
              ? (() => {
                  const days =
                    Array.from(
                      new Set(
                        patch.daysOfWeek.filter(
                          (day) =>
                            Number.isInteger(day) &&
                            day >= 0 &&
                            day <= 6,
                        ),
                      ),
                    )

                  return days.length > 0
                    ? days
                    : item.daysOfWeek
                })()
              : item.daysOfWeek,
          recoveryDays:
            typeof patch.recoveryDays ===
              "number" &&
            Number.isFinite(
              patch.recoveryDays,
            )
              ? Math.max(
                  0,
                  Math.min(
                    3,
                    Math.round(
                      patch.recoveryDays,
                    ),
                  ),
                )
              : item.recoveryDays,
        }
      }),
    )

    recordPendingMutation(
      (mutations) => {
        addOfflineMutationId(
          mutations.routineItemIds,
          id,
        )
      },
    )
  }

  const deleteRoutineItem = (
    id: string,
  ) => {
    const removeLocal = () => {
      setRoutineItems((previous) =>
        previous.filter(
          (item) => item.id !== id,
        ),
      )
    }

    if (
      authSession &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      removeLocal()
      recordPendingMutation(
        (mutations) => {
          removeOfflineMutationId(
            mutations.routineItemIds,
            id,
          )
          addOfflineMutationId(
            mutations.deletedRoutineItemIds,
            id,
          )
        },
      )
      setCloudStatus("offline")
      return
    }

    if (authSession) {
      void (async () => {
        const ready =
          await flushBeforeDestructiveMutation()

        if (!ready) {
          return
        }

        await deleteSupabaseRoutineItem(
          authSession.user.id,
          id,
        )

        removeLocal()
      })().catch((error) => {
        console.error(
          "FOCUS routine delete failed:",
          error,
        )
        setCloudStatus("error")
      })

      return
    }

    removeLocal()
  }

  const addAdvancedGoal = (
    title: string,
    targetMinutes: number,
    deadline: string,
    priority: AdvancedGoal["priority"],
    subjectId?: string,
  ) => {
    const cleanTitle = title.trim()
    const safeTarget = Math.max(1, Math.round(targetMinutes))
    const deadlineDate = new Date(deadline)

    if (
      !cleanTitle ||
      !Number.isFinite(safeTarget) ||
      Number.isNaN(deadlineDate.getTime())
    ) {
      return
    }

    const goal: AdvancedGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      subjectId: subjectId || undefined,
      targetMinutes: safeTarget,
      deadline: deadlineDate.toISOString(),
      priority,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    setAdvancedGoals((previous) => [goal, ...previous])
    recordPendingMutation(
      (mutations) => {
        addOfflineMutationId(
          mutations.advancedGoalIds,
          goal.id,
        )
      },
    )
  }

  const updateAdvancedGoal = (
    id: string,
    patch: Partial<Omit<AdvancedGoal, "id" | "createdAt">>,
  ) => {
    setAdvancedGoals((previous) =>
      previous.map((goal) =>
        goal.id === id
          ? { ...goal, ...patch }
          : goal,
      ),
    )
    recordPendingMutation(
      (mutations) => {
        addOfflineMutationId(
          mutations.advancedGoalIds,
          id,
        )
      },
    )
  }

  const deleteAdvancedGoal = (id: string) => {
    const removeLocal = () => {
      setAdvancedGoals((previous) =>
        previous.filter(
          (goal) => goal.id !== id,
        ),
      )
    }

    if (
      authSession &&
      typeof navigator !== "undefined" &&
      !navigator.onLine
    ) {
      removeLocal()
      recordPendingMutation(
        (mutations) => {
          removeOfflineMutationId(
            mutations.advancedGoalIds,
            id,
          )
          addOfflineMutationId(
            mutations.deletedAdvancedGoalIds,
            id,
          )
        },
      )
      setCloudStatus("offline")
      return
    }

    if (authSession) {
      void (async () => {
        const ready =
          await flushBeforeDestructiveMutation()

        if (!ready) {
          return
        }

        await deleteSupabaseAdvancedGoal(
          authSession.user.id,
          id,
        )

        removeLocal()
      })().catch((error) => {
        console.error(
          "FOCUS advanced goal delete failed:",
          error,
        )
        setCloudStatus("error")
      })

      return
    }

    removeLocal()
  }

  const exportData = () => {
    const backup = {
      version: 7,
      exportedAt: new Date().toISOString(),
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      advancedGoals,
      routineItems,
      settings,
      activeSubjectId,
      workspacePreferencesVersion,
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
        const seenSubjectIds = new Set<string>()
        const seenSubjectNames = new Set<string>()

        const importedSubjects =
          (data.subjects as unknown[]).flatMap(
            (candidate): Subject[] => {
              if (
                !candidate ||
                typeof candidate !== "object" ||
                Array.isArray(candidate)
              ) {
                return []
              }

              const value =
                candidate as Record<string, unknown>
              const id =
                typeof value.id === "string"
                  ? value.id.trim()
                  : ""
              const name =
                typeof value.name === "string"
                  ? normalizeSubjectName(value.name)
                  : ""
              const color =
                typeof value.color === "string"
                  ? value.color.trim()
                  : ""
              const normalizedName =
                name.toLocaleLowerCase()

              if (
                !id ||
                !name ||
                !color ||
                seenSubjectIds.has(id) ||
                seenSubjectNames.has(normalizedName)
              ) {
                return []
              }

              seenSubjectIds.add(id)
              seenSubjectNames.add(normalizedName)

              return [{
                id,
                name,
                color,
                icon:
                  typeof value.icon === "string"
                    ? value.icon
                    : undefined,
              }]
            },
          )

        const importedSubjectIds =
          new Set(
            importedSubjects.map(
              (subject) => subject.id,
            ),
          )

        const seenSessionIds = new Set<string>()

        const importedSessions: StudySession[] =
          data.sessions.flatMap(
            (candidate): StudySession[] => {
              if (
                !candidate ||
                typeof candidate !== "object" ||
                Array.isArray(candidate)
              ) {
                return []
              }

              const value =
                candidate as Record<string, unknown>
              const id =
                typeof value.id === "string"
                  ? value.id.trim()
                  : ""
              const subjectId =
                typeof value.subjectId === "string"
                  ? value.subjectId.trim()
                  : ""
              const completedAt =
                new Date(
                  typeof value.completedAt === "string"
                    ? value.completedAt
                    : "",
                )
              const startedAt =
                typeof value.startedAt === "string"
                  ? new Date(value.startedAt)
                  : undefined

              if (
                !id ||
                !subjectId ||
                seenSessionIds.has(id) ||
                Number.isNaN(
                  completedAt.getTime(),
                ) ||
                (startedAt &&
                  Number.isNaN(
                    startedAt.getTime(),
                  ))
              ) {
                return []
              }

              const duration =
                typeof value.duration === "number" &&
                Number.isFinite(value.duration)
                  ? Math.max(
                      0,
                      value.duration,
                    )
                  : 0
              const actualDuration =
                typeof value.actualDuration === "number" &&
                Number.isFinite(
                  value.actualDuration,
                )
                  ? Math.max(
                      0,
                      value.actualDuration,
                    )
                  : duration
              const interruptions =
                typeof value.interruptions === "number" &&
                Number.isFinite(
                  value.interruptions,
                )
                  ? Math.max(
                      0,
                      Math.round(
                        value.interruptions,
                      ),
                    )
                  : 0
              const totalPausedSeconds =
                typeof value.totalPausedSeconds === "number" &&
                Number.isFinite(
                  value.totalPausedSeconds,
                )
                  ? Math.max(
                      0,
                      Math.round(
                        value.totalPausedSeconds,
                      ),
                    )
                  : 0
              const activeSubject =
                importedSubjects.find(
                  (subject) =>
                    subject.id === subjectId,
                )
              const subjectName =
                typeof value.subjectName === "string" &&
                value.subjectName.trim()
                  ? value.subjectName.trim()
                  : activeSubject?.name ??
                    "Archived subject"
              const subjectColor =
                typeof value.subjectColor === "string" &&
                value.subjectColor.trim()
                  ? value.subjectColor.trim()
                  : activeSubject?.color ??
                    "#8b5cf6"

              const subtasks = Array.isArray(
                value.subtasks,
              )
                ? value.subtasks.flatMap(
                    (subtask): NonNullable<
                      StudySession["subtasks"]
                    > => {
                      if (
                        !subtask ||
                        typeof subtask !== "object" ||
                        Array.isArray(subtask)
                      ) {
                        return []
                      }

                      const item =
                        subtask as Record<string, unknown>

                      if (
                        typeof item.id !== "string" ||
                        typeof item.text !== "string" ||
                        typeof item.completed !== "boolean"
                      ) {
                        return []
                      }

                      return [{
                        id: item.id,
                        text: item.text,
                        completed: item.completed,
                      }]
                    },
                  )
                : undefined

              seenSessionIds.add(id)

              return [{
                id,
                subjectId,
                subjectName,
                subjectColor,
                duration,
                actualDuration,
                startedAt,
                completedAt,
                completed:
                  typeof value.completed === "boolean"
                    ? value.completed
                    : true,
                interruptions,
                totalPausedSeconds,
                notes:
                  typeof value.notes === "string"
                    ? value.notes
                    : undefined,
                subtasks,
                routineItemId:
                  typeof value.routineItemId === "string" &&
                  value.routineItemId.trim()
                    ? value.routineItemId.trim()
                    : undefined,
                routineDate:
                  typeof value.routineDate === "string" &&
                  /^\d{4}-\d{2}-\d{2}$/.test(
                    value.routineDate,
                  )
                    ? value.routineDate
                    : undefined,
              }]
            },
          )

        if (authSession) {
          cloudReplaceRequested.current =
            true
          offlineMutations.current =
            createOfflineMutationState()
          offlineMutations.current
            .replaceWorkspace = true

          if (
            typeof navigator !== "undefined" &&
            !navigator.onLine
          ) {
            offlineRecoveryRequested.current =
              true
          }

          saveOfflineMutationState(
            authSession.user.id,
            offlineMutations.current,
          )
        }

        setSessions(importedSessions)
        setSubjects(importedSubjects)

        if (Array.isArray(data.advancedGoals)) {
          const seenGoalIds = new Set<string>()
          const importedAdvancedGoals =
            data.advancedGoals.flatMap(
              (goal): AdvancedGoal[] => {
                if (
                  !goal ||
                  typeof goal !== "object" ||
                  Array.isArray(goal)
                ) {
                  return []
                }

                const value =
                  goal as Record<string, unknown>
                const id =
                  typeof value.id === "string"
                    ? value.id.trim()
                    : ""
                const title =
                  typeof value.title === "string"
                    ? value.title.trim()
                    : ""
                const targetMinutes =
                  typeof value.targetMinutes === "number" &&
                  Number.isFinite(
                    value.targetMinutes,
                  )
                    ? Math.max(
                        1,
                        Math.round(
                          value.targetMinutes,
                        ),
                      )
                    : 0
                const deadline =
                  typeof value.deadline === "string"
                    ? new Date(value.deadline)
                    : new Date(Number.NaN)
                const createdAt =
                  typeof value.createdAt === "string"
                    ? new Date(value.createdAt)
                    : new Date(Number.NaN)

                if (
                  !id ||
                  !title ||
                  targetMinutes <= 0 ||
                  seenGoalIds.has(id) ||
                  Number.isNaN(
                    deadline.getTime(),
                  ) ||
                  Number.isNaN(
                    createdAt.getTime(),
                  ) ||
                  (value.priority !== "low" &&
                    value.priority !== "medium" &&
                    value.priority !== "high") ||
                  (value.status !== "active" &&
                    value.status !== "completed")
                ) {
                  return []
                }

                seenGoalIds.add(id)

                const subjectId =
                  typeof value.subjectId === "string" &&
                  importedSubjectIds.has(
                    value.subjectId,
                  )
                    ? value.subjectId
                    : undefined

                return [{
                  id,
                  title,
                  subjectId,
                  targetMinutes,
                  deadline:
                    deadline.toISOString(),
                  priority: value.priority,
                  status: value.status,
                  createdAt:
                    createdAt.toISOString(),
                }]
              },
            )

          setAdvancedGoals(
            importedAdvancedGoals,
          )
        } else {
          setAdvancedGoals([])
        }

        if (Array.isArray(data.routineItems)) {
          const seenRoutineIds =
            new Set<string>()

          const importedRoutineItems =
            data.routineItems.flatMap(
              (
                candidate,
              ): RoutineItem[] => {
                if (
                  !candidate ||
                  typeof candidate !==
                    "object" ||
                  Array.isArray(
                    candidate,
                  )
                ) {
                  return []
                }

                const value =
                  candidate as Record<
                    string,
                    unknown
                  >
                const id =
                  typeof value.id ===
                    "string"
                    ? value.id.trim()
                    : ""
                const title =
                  typeof value.title ===
                    "string"
                    ? value.title.trim()
                    : ""
                const subjectId =
                  typeof value.subjectId ===
                    "string"
                    ? value.subjectId.trim()
                    : ""
                const targetMinutes =
                  typeof value.targetMinutes ===
                    "number" &&
                  Number.isFinite(
                    value.targetMinutes,
                  )
                    ? Math.min(
                        720,
                        Math.max(
                          1,
                          Math.round(
                            value.targetMinutes,
                          ),
                        ),
                      )
                    : 25
                const rotationOrder =
                  typeof value.rotationOrder ===
                    "number" &&
                  Number.isFinite(
                    value.rotationOrder,
                  )
                    ? Math.max(
                        0,
                        Math.round(
                          value.rotationOrder,
                        ),
                      )
                    : 0
                const createdAt =
                  typeof value.createdAt ===
                    "string"
                    ? new Date(
                        value.createdAt,
                      )
                    : new Date(Number.NaN)

                if (
                  !id ||
                  !title ||
                  !subjectId ||
                  !importedSubjectIds.has(
                    subjectId,
                  ) ||
                  seenRoutineIds.has(id) ||
                  Number.isNaN(
                    createdAt.getTime(),
                  )
                ) {
                  return []
                }

                seenRoutineIds.add(id)

                return [{
                  id,
                  title,
                  subjectId,
                  targetMinutes,
                  mode:
                    value.mode ===
                    "rotation"
                      ? "rotation"
                      : "fixed",
                  rotationOrder,
                  daysOfWeek:
                    Array.isArray(
                      value.daysOfWeek,
                    )
                      ? Array.from(
                          new Set(
                            value.daysOfWeek.filter(
                              (day): day is number =>
                                typeof day === "number" &&
                                Number.isInteger(day) &&
                                day >= 0 &&
                                day <= 6,
                            ),
                          ),
                        ).length > 0
                        ? Array.from(
                            new Set(
                              value.daysOfWeek.filter(
                                (day): day is number =>
                                  typeof day === "number" &&
                                  Number.isInteger(day) &&
                                  day >= 0 &&
                                  day <= 6,
                              ),
                            ),
                          )
                        : [0, 1, 2, 3, 4, 5, 6]
                      : [0, 1, 2, 3, 4, 5, 6],
                  recoveryDays:
                    typeof value.recoveryDays === "number" &&
                    Number.isFinite(
                      value.recoveryDays,
                    )
                      ? Math.max(
                          0,
                          Math.min(
                            3,
                            Math.round(
                              value.recoveryDays,
                            ),
                          ),
                        )
                      : 1,
                  enabled:
                    value.enabled !==
                    false,
                  createdAt:
                    createdAt.toISOString(),
                }]
              },
            )

          setRoutineItems(
            importedRoutineItems,
          )
        } else {
          setRoutineItems([])
        }

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
        if (
          data.settings &&
          typeof data.settings === "object" &&
          !Array.isArray(data.settings)
        ) {
          setSettings(
            normalizeSettings(
              data.settings as Partial<AppSettings>,
            ),
          )
        }

        const requestedActiveSubject =
          typeof data.activeSubjectId === "string"
            ? data.activeSubjectId
            : null

        setActiveSubjectId(
          requestedActiveSubject &&
            importedSubjects.some(
              (subject) =>
                subject.id ===
                requestedActiveSubject,
            )
            ? requestedActiveSubject
            : importedSubjects[0]?.id ?? null,
        )

        setWorkspacePreferencesVersion(1)
        alert(t("dataImported"))
      } catch { alert(t("invalidBackup")) }
    }
    reader.onerror = () => alert(t("backupReadFailed"))
    reader.readAsText(file)
  }

  const userId = authSession?.user.id

  useEffect(() => {
    if (!supabase || !userId || !cloudReady) {
      return
    }

    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let refreshing = false

    const runRefreshFromCloud = () => {
      if (
        cloudSaveFailed.current &&
        !cloudSaveInFlight.current
      ) {
        return
      }

      if (
        refreshing ||
        cloudSaveInFlight.current ||
        queuedCloudSnapshot.current
      ) {
        refreshTimer = setTimeout(
          runRefreshFromCloud,
          300,
        )
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
            setAdvancedGoals(cloudSnapshot.advancedGoals)
            setRoutineItems(cloudSnapshot.routineItems)
            setSettings(cloudSnapshot.settings)
            setWorkspacePreferencesVersion(
              cloudSnapshot.workspacePreferencesVersion,
            )

            lastCloudFingerprint.current =
              fingerprint
            setCloudStatus("synced")
          })
          .catch((error) => {
            console.error(
              "FOCUS realtime refresh failed:",
              error,
            )
            setCloudStatus("error")
          })
        .finally(() => {
          refreshing = false
        })
    }

    const refreshFromCloud = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = setTimeout(
        runRefreshFromCloud,
        300,
      )
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
          table: "advanced_goals",
          filter: `user_id=eq.${userId}`,
        },
        refreshFromCloud,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routine_items",
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

  return { subjects, activeSubjectId, sessions, dailyGoal, weeklyGoal, weeklyGoalsHistory, advancedGoals, routineItems, settings, cloudStatus, setDailyGoal: setDailyGoalValue, setWeeklyGoal, setSettings, updateSettings, addSession, deleteSession, addSubject, deleteSubject, selectSubject, addRoutineItem, updateRoutineItem, deleteRoutineItem, addAdvancedGoal, updateAdvancedGoal, deleteAdvancedGoal, exportData, importData, flushCloudChanges }
}
