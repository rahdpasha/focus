import { createClientId } from '../../utils/clientId'
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Check,
} from 'lucide-react'
import DurationSelector from './DurationSelector'
import { getEarlyFinishSeconds } from '../../utils/earlyFinish'
import { useI18n } from '../../useI18n'
import {
  pausedFromClock,
  readTimerSnapshot,
  remainingFromClock,
  writeTimerSnapshot,
  type TimerMode,
  TIMER_STORAGE_KEY,
} from '../../utils/timerPersistence'

interface TimerProps {
  persistenceKey?: string
  subjectName: string
  subjectColor: string

  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean

  onActivityChange?: (active: boolean) => void
  onComplete: () => void
  onSessionStart?: (startedAt: Date, sessionClientId: string, plannedSeconds: number, endAt: number) => void
  onSessionPause?: (sessionClientId: string, pausedSeconds: number, interruptions: number) => void
  onSessionResume?: (sessionClientId: string, endAt: number, pausedSeconds: number) => void
  onSessionCancel?: (sessionClientId: string) => void
  onSessionCompleted?: (sessionClientId: string) => void
  initialFocusMinutes?: number

  onSessionEnd: (
    duration: number,
    actualDuration: number,
    completed: boolean,
    interruptions: number,
    totalPausedSeconds: number,
    startedAt: Date,
    sessionClientId: string,
    completedAt?: Date
  ) => void
}

export default function Timer({
  persistenceKey = TIMER_STORAGE_KEY,
  subjectName,
  subjectColor,
  shortBreakMinutes,
  longBreakMinutes,
  sessionsBeforeLongBreak,
  autoStartBreak,
  soundEnabled,
  soundVolume,
  notificationsEnabled,
  onActivityChange,
  onComplete,
  onSessionStart,
  onSessionPause,
  onSessionResume,
  onSessionCancel,
  onSessionCompleted,
  onSessionEnd,
  initialFocusMinutes = 25,
}: TimerProps) {
  const { language, t, tr } = useI18n()

  const initialSeconds = Math.max(1, initialFocusMinutes) * 60
  // Restore a saved session when returning from another page, refreshing,
  // or reopening the installed app. A deadline survives suspended JS timers.
  const [restored] = useState(() => readTimerSnapshot(subjectName, persistenceKey))
  const [focusDuration, setFocusDuration] = useState(restored?.focusDuration ?? initialSeconds)
  const [duration, setDuration] = useState(restored?.duration ?? initialSeconds)
  const [timeRemaining, setTimeRemaining] = useState(() =>
    restored?.isStudying
      ? remainingFromClock(restored.timerEndAt, restored.timeRemaining)
      : restored?.timeRemaining ?? initialSeconds
  )

  const [mode, setMode] =
    useState<TimerMode>(restored?.mode ?? 'focus')

  const [
    completedFocusSessions,
    setCompletedFocusSessions,
  ] = useState(restored?.completedFocusSessions ?? 0)

  const [isStudying, setIsStudying] =
    useState(restored?.isStudying ?? false)

  const [isPaused, setIsPaused] =
    useState(restored?.isPaused ?? false)

  const [isCompleted, setIsCompleted] =
    useState(false)

  const [showComplete, setShowComplete] =
    useState(false)

  const [showEarlyFinishConfirm, setShowEarlyFinishConfirm] =
    useState(false)
  const [completedEarly, setCompletedEarly] = useState(false)
  const [lastCompletedSeconds, setLastCompletedSeconds] =
    useState<number | null>(null)

  const [pausedSeconds, setPausedSeconds] =
    useState(() => restored?.isPaused
      ? pausedFromClock(restored.pauseStartedAt, restored.pauseBaseSeconds)
      : restored?.pausedSeconds ?? 0
    )

  const [interruptionCount, setInterruptionCount] =
    useState(restored?.interruptionCount ?? 0)

  const intervalRef =
    useRef<number | null>(null)

  const timerEndRef =
    useRef<number | null>(restored?.timerEndAt ?? null)

  const pauseStartedAtRef =
    useRef<number | null>(restored?.pauseStartedAt ?? null)
  const pauseBaseSecondsRef =
    useRef(restored?.pauseBaseSeconds ?? 0)

  const finishedRef =
    useRef(false)

  const sessionStartedAtRef =
    useRef<Date | null>(restored?.sessionStartedAt
      ? new Date(restored.sessionStartedAt)
      : null
    )
  const sessionClientIdRef = useRef<string | null>(
    restored?.sessionClientId ??
    (restored?.sessionStartedAt ? 's' + restored.sessionStartedAt : null)
  )

  useEffect(() => { onActivityChange?.(isStudying || isPaused) }, [isStudying, isPaused, onActivityChange])

  const isFocus = mode === 'focus'

  const focusedSeconds = Math.max(
    0,
    focusDuration - timeRemaining
  )

  const minutes = Math.floor(
    timeRemaining / 60
  )

  const seconds = timeRemaining % 60

  const displayTime =
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`

  const pauseMinutes =
    Math.floor(pausedSeconds / 60)

  const pauseSecs =
    pausedSeconds % 60

  const circumference =
    2 * Math.PI * 135

  const progress =
    duration > 0
      ? ((duration - timeRemaining) /
          duration) *
        100
      : 0

  const dashOffset =
    circumference -
    (progress / 100) * circumference

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(
        intervalRef.current
      )

      intervalRef.current = null
    }

    timerEndRef.current = null
  }, [])

  const playCompletionSound = useCallback(
    (isBreakComplete: boolean) => {
      if (!soundEnabled) {
        return
      }

      const AudioContextClass =
        window.AudioContext

      if (!AudioContextClass) {
        return
      }

      const context =
        new AudioContextClass()

      const oscillator =
        context.createOscillator()

      const gain =
        context.createGain()

      oscillator.type = 'sine'

      oscillator.frequency.setValueAtTime(
        isBreakComplete ? 660 : 880,
        context.currentTime
      )

      oscillator.frequency.linearRampToValueAtTime(
        isBreakComplete ? 880 : 1320,
        context.currentTime + 0.15
      )

      gain.gain.setValueAtTime(
        Math.max(0, Math.min(1, soundVolume / 100)) * 0.18,
        context.currentTime
      )

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.7
      )

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start()
      oscillator.stop(
        context.currentTime + 0.7
      )

      window.setTimeout(() => {
        void context.close()
      }, 900)
    },
    [soundEnabled, soundVolume]
  )

  const sendCompletionNotification = useCallback(
    (isBreakComplete: boolean) => {
      if (
        !notificationsEnabled ||
        !('Notification' in window)
      ) {
        return
      }

      if (
        Notification.permission !== 'granted'
      ) {
        return
      }

      const title = isBreakComplete
        ? tr('Break complete', 'پشوودان تەواو بوو')
        : tr('Focus session complete', 'سێشنی سەرنج تەواو بوو')

      const body = isBreakComplete
        ? tr('Break finished. Ready to focus again.', 'پشوودان تەواو بوو. ئامادەیت دووبارە سەرنج بدەیت.')
        : tr(
            `${subjectName} session complete. Time for a break.`,
            `سێشنی ${subjectName} تەواو بوو. کاتی پشوودانە.`,
          )

      const options: NotificationOptions = {
        body,
        icon: '/icon-192.png',
        tag: isBreakComplete ? 'focus-break-complete' : 'focus-session-complete',
      }

      // iOS Home Screen web apps use service-worker notifications;
      // the Notification constructor itself is not available there.
      if ('serviceWorker' in navigator) {
        void navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(title, options))
          .catch(() => {
            // Browsers can deny display while suspended or in Focus mode.
          })
        return
      }

      try {
        new Notification(title, options)
      } catch {
        // Do not let notification failures interrupt session saving.
      }
    },
    [
      notificationsEnabled,
      subjectName,
      tr,
    ]
  )

  const resetTracking = useCallback(() => {
    setPausedSeconds(0)
    setInterruptionCount(0)
    pauseStartedAtRef.current = null
    pauseBaseSecondsRef.current = 0
    finishedRef.current = false
    sessionStartedAtRef.current = null
    sessionClientIdRef.current = null
  }, [])

  useEffect(() => {
    writeTimerSnapshot({
      version: 1,
      subjectName,
      sessionClientId: sessionClientIdRef.current,
      focusDuration,
      duration,
      timeRemaining,
      mode,
      completedFocusSessions,
      isStudying,
      isPaused,
      timerEndAt: timerEndRef.current,
      sessionStartedAt: sessionStartedAtRef.current?.getTime() ?? null,
      pausedSeconds,
      pauseStartedAt: pauseStartedAtRef.current,
      pauseBaseSeconds: pauseBaseSecondsRef.current,
      interruptionCount,
    }, persistenceKey)
  }, [
    persistenceKey,
    subjectName, focusDuration, duration, timeRemaining, mode,
    completedFocusSessions, isStudying, isPaused,
    pausedSeconds, interruptionCount,
  ])

  const handleDurationChange = (
    newDuration: number
  ) => {
    if (
      isStudying ||
      isPaused ||
      !isFocus
    ) {
      return
    }

    clearTimer()

    setFocusDuration(newDuration)
    setDuration(newDuration)
    setTimeRemaining(newDuration)

    setMode('focus')
    setIsCompleted(false)
    setShowComplete(false)
    setShowEarlyFinishConfirm(false)
    setCompletedEarly(false)
    setLastCompletedSeconds(null)

    resetTracking()
  }

  const startTimer = () => {
    if (timeRemaining <= 0) {
      return
    }

    timerEndRef.current =
      Date.now() +
      timeRemaining * 1000

    if (isFocus && sessionStartedAtRef.current === null) {
      const startedAt = new Date()
      sessionStartedAtRef.current = startedAt
      sessionClientIdRef.current = 's' + startedAt.getTime() + '-' + createClientId().slice(0, 8)
      onSessionStart?.(
        startedAt,
        sessionClientIdRef.current,
        focusDuration,
        timerEndRef.current!,
      )
    }

    setIsStudying(true)
    setIsPaused(false)
    setIsCompleted(false)
    setShowComplete(false)
    setShowEarlyFinishConfirm(false)
  }

  const pauseTimer = () => {
    if (!isStudying) {
      return
    }

    if (timerEndRef.current !== null) {
      const remaining = Math.max(
        0,
        Math.ceil(
          (timerEndRef.current -
            Date.now()) /
            1000
        )
      )

      setTimeRemaining(remaining)
      timerEndRef.current = null
    }

    setIsStudying(false)
    setIsPaused(true)

    if (isFocus && sessionClientIdRef.current) {
      onSessionPause?.(sessionClientIdRef.current, pausedSeconds, interruptionCount + 1)
    }

    if (isFocus) {
      setInterruptionCount(
        (count) => count + 1
      )
    }

    pauseBaseSecondsRef.current = pausedSeconds
    pauseStartedAtRef.current = Date.now()
  }

  const resumeTimer = () => {
    if (timeRemaining <= 0) {
      return
    }

    timerEndRef.current =
      Date.now() +
      timeRemaining * 1000

    setIsPaused(false)
    setIsStudying(true)

    if (isFocus && sessionClientIdRef.current) {
      onSessionResume?.(
        sessionClientIdRef.current,
        timerEndRef.current!,
        pausedFromClock(pauseStartedAtRef.current, pauseBaseSecondsRef.current),
      )
    }

    const pausedUntil = pauseStartedAtRef.current
    if (pausedUntil !== null) {
      const total = pausedFromClock(
        pausedUntil, pauseBaseSecondsRef.current
      )
      pauseBaseSecondsRef.current = total
      setPausedSeconds(total)
      pauseStartedAtRef.current = null
    }
  }

  const resetTimer = () => {
    if (isFocus && sessionClientIdRef.current && !isCompleted && !showComplete) {
      onSessionCancel?.(sessionClientIdRef.current)
    }
    clearTimer()

    setIsStudying(false)
    setIsPaused(false)
    setIsCompleted(false)
    setShowComplete(false)
    setShowEarlyFinishConfirm(false)
    setCompletedEarly(false)
    setLastCompletedSeconds(null)

    setMode('focus')
    setDuration(focusDuration)
    setTimeRemaining(focusDuration)

    resetTracking()
  }

  const startBreak = useCallback(
    (
      breakMode:
        | 'shortBreak'
        | 'longBreak',
      autoStart = false
    ) => {
      const breakDuration =
        breakMode === 'longBreak'
          ? longBreakMinutes * 60
          : shortBreakMinutes * 60

      clearTimer()

      setMode(breakMode)
      setDuration(breakDuration)
      setTimeRemaining(breakDuration)

      setIsStudying(autoStart)
      setIsPaused(false)
      setIsCompleted(false)
      setShowComplete(false)
      setShowEarlyFinishConfirm(false)
      setCompletedEarly(false)
      setLastCompletedSeconds(null)

      resetTracking()
    },
    [
      clearTimer,
      longBreakMinutes,
      shortBreakMinutes,
      resetTracking,
    ]
  )

  const finishFocusSession =
    useCallback(() => {
      const startedAt =
        sessionStartedAtRef.current ??
        new Date()

      const elapsedSeconds = Math.round(
        (Date.now() - startedAt.getTime()) / 1000,
      )

      const actualDuration = Math.max(
        0,
        Math.min(
          focusDuration,
          elapsedSeconds - pausedSeconds,
        ),
      )

      playCompletionSound(false)
      sendCompletionNotification(false)
      setCompletedEarly(false)
      setLastCompletedSeconds(actualDuration)
      setShowEarlyFinishConfirm(false)

      onComplete()

      

      onSessionEnd(
        focusDuration,
        actualDuration,
        true,
        interruptionCount,
        pausedSeconds,
        sessionStartedAtRef.current ?? new Date(),
        sessionClientIdRef.current ?? ('s' + startedAt.getTime()),
        new Date(timerEndRef.current ?? Date.now()),
      )
      if (sessionClientIdRef.current) {
        onSessionCompleted?.(sessionClientIdRef.current)
      }

      setCompletedFocusSessions(
        (previous) => previous + 1
      )

      setIsStudying(false)
      setIsPaused(false)
      setIsCompleted(true)
      setShowComplete(true)
    }, [
      focusDuration,
      pausedSeconds,
      interruptionCount,
      playCompletionSound,
      sendCompletionNotification,
      onComplete,
      onSessionEnd,
      onSessionCompleted,
    ])

  // Early completion is a completed *study log*, not a completed Pomodoro.
  // Only real elapsed focus seconds count toward goals, routines and League.
  const handleFinishEarly = () => {
    const startedAt = sessionStartedAtRef.current
    const sessionClientId = sessionClientIdRef.current

    if (
      !isFocus ||
      (!isStudying && !isPaused) ||
      !startedAt ||
      !sessionClientId ||
      finishedRef.current
    ) {
      return
    }

    const now = Date.now()
    // The countdown may have expired while the user was reading the prompt.
    // Let the normal timer completion handler own that case.
    if (isStudying && timerEndRef.current !== null && now >= timerEndRef.current) {
      setShowEarlyFinishConfirm(false)
      handleTimerFinished()
      return
    }

    const totalPausedSeconds = pausedFromClock(
      pauseStartedAtRef.current,
      pauseBaseSecondsRef.current,
      now,
    )
    const actualDuration = getEarlyFinishSeconds(
      startedAt.getTime(),
      now,
      totalPausedSeconds,
      focusDuration,
    )

    if (actualDuration <= 0) {
      setShowEarlyFinishConfirm(false)
      return
    }

    finishedRef.current = true
    clearTimer()
    onComplete() // Stop ambient sound.

    onSessionEnd(
      focusDuration,
      actualDuration,
      true,
      interruptionCount,
      totalPausedSeconds,
      startedAt,
      sessionClientId,
      new Date(now),
    )
    // Mark the scheduled background completion as finished so it cannot
    // alert again at the original planned end time.
    onSessionCompleted?.(sessionClientId)

    // The next timer is fresh. An early finish must not advance the
    // Pomodoro counter or automatically begin a break.
    setCompletedEarly(true)
    setLastCompletedSeconds(actualDuration)
    setShowEarlyFinishConfirm(false)
    setIsStudying(false)
    setIsPaused(false)
    setIsCompleted(true)
    setShowComplete(true)
    setTimeRemaining(focusDuration)
    resetTracking()
  }

  const finishBreak = useCallback(() => {
    const wasLongBreak =
      mode === 'longBreak'

    playCompletionSound(true)
    sendCompletionNotification(true)

    clearTimer()

    setIsStudying(false)
    setIsPaused(false)
    setIsCompleted(true)
    setShowComplete(false)

    if (wasLongBreak) {
      setCompletedFocusSessions(0)
    }

    setMode('focus')
    setDuration(focusDuration)
    setTimeRemaining(focusDuration)

    resetTracking()
  }, [
    clearTimer,
    focusDuration,
    mode,
    playCompletionSound,
    sendCompletionNotification,
    resetTracking,
  ])

  const handleTimerFinished =
    useCallback(() => {
      if (finishedRef.current) {
        return
      }

      finishedRef.current = true
      // Persist completion immediately. A display countdown used to delay the
      // write and could be suspended between expiry and saving.
      if (isFocus) finishFocusSession()
      else finishBreak()
      clearTimer()

    }, [
      clearTimer,
      isFocus,
      finishFocusSession,
      finishBreak,
    ])


  useEffect(() => {
    if (!isStudying) {
      return
    }

    if (timerEndRef.current === null) {
      timerEndRef.current =
        Date.now() +
        timeRemaining * 1000
    }

    const updateRemaining =
      () => {
        if (
          timerEndRef.current === null
        ) {
          return
        }

        const remaining =
          Math.max(
            0,
            Math.ceil(
              (timerEndRef.current -
                Date.now()) /
                1000
            )
          )

        setTimeRemaining(
          remaining
        )

        if (remaining <= 0) {
          

          if (
            intervalRef.current !==
            null
          ) {
            clearInterval(
              intervalRef.current
            )

            intervalRef.current = null
          }
        }
      }

    updateRemaining()

    intervalRef.current =
      window.setInterval(
        updateRemaining,
        250
      )

    // Catch up instantly when an iPhone unlocks, the tab becomes visible,
    // or a suspended PWA returns to the foreground.
    document.addEventListener('visibilitychange', updateRemaining)
    window.addEventListener('pageshow', updateRemaining)

    return () => {
      document.removeEventListener('visibilitychange', updateRemaining)
      window.removeEventListener('pageshow', updateRemaining)
      if (
        intervalRef.current !==
        null
      ) {
        clearInterval(
          intervalRef.current
        )

        intervalRef.current = null
      }
    }
  }, [isStudying, timeRemaining])


  useEffect(() => {
    if (!isStudying) {
      return
    }

    if (timeRemaining !== 0) {
      return
    }

    

    const timeout =
      window.setTimeout(() => {
        handleTimerFinished()
      }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    isStudying,
    timeRemaining,
    handleTimerFinished,
  ])

  useEffect(() => {
    if (!isPaused) return

    const refreshPausedTime = () => {
      setPausedSeconds(pausedFromClock(
        pauseStartedAtRef.current,
        pauseBaseSecondsRef.current,
      ))
    }
    refreshPausedTime()
    const id = window.setInterval(refreshPausedTime, 1000)
    document.addEventListener('visibilitychange', refreshPausedTime)
    window.addEventListener('pageshow', refreshPausedTime)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refreshPausedTime)
      window.removeEventListener('pageshow', refreshPausedTime)
    }
  }, [isPaused])

  useEffect(() => {
    if (!showComplete) {
      return
    }

    if (!isFocus) {
      return
    }

    if (!autoStartBreak || completedEarly) {
      return
    }

    const nextCount =
      completedFocusSessions

    const nextBreak =
      nextCount >=
      sessionsBeforeLongBreak
        ? 'longBreak'
        : 'shortBreak'

    const timeout =
      window.setTimeout(() => {
        setShowComplete(false)
        startBreak(
          nextBreak,
          true
        )
      }, 1200)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    showComplete,
    isFocus,
    autoStartBreak,
    completedEarly,
    completedFocusSessions,
    sessionsBeforeLongBreak,
    startBreak,
  ])

  useEffect(() => {
    return () => {
      // Only cancel callbacks here: React StrictMode may replay effects,
      // and clearing the saved deadline would restart a running session.
      if (intervalRef.current !== null) clearInterval(intervalRef.current)


    }
  }, [])

  const getTimerColor = () => {
    if (isCompleted) {
      return 'var(--success)'
    }

    if (isPaused) {
      return 'var(--energy)'
    }

    if (!isFocus) {
      return mode === 'longBreak'
        ? 'var(--teal)'
        : 'var(--cyber-blue)'
    }

    if (timeRemaining <= 60) {
      return 'var(--danger)'
    }

    if (timeRemaining <= 300) {
      return 'var(--energy)'
    }

    return subjectColor
  }

  const timerColor =
    getTimerColor()

  const modeLabel =
    mode === 'focus'
      ? subjectName
      : mode === 'shortBreak'
        ? t('shortBreak')
        : t('longBreak')

  const canTakeLongBreak =
    completedFocusSessions >=
    sessionsBeforeLongBreak


  if (
    showComplete &&
    isFocus &&
    (!autoStartBreak || completedEarly)
  ) {
    return (
      <div className="timer-v5-complete">
        <div className="timer-v5-complete-mark">
          ✓
        </div>

        <div>
          <span className="eyebrow">
            {completedEarly
              ? tr('Study saved', 'خوێندنەکەت پاشەکەوت کرا')
              : tr('Session complete', 'سێشن تەواو بوو')}
          </span>
          <h2>
            {tr(`${subjectName} is done.`, `${subjectName} تەواو بوو.`)}
          </h2>
        </div>

        <strong className="mono timer-v5-complete-time">
          {Math.floor((lastCompletedSeconds ?? focusDuration) / 60)}:
          {String((lastCompletedSeconds ?? focusDuration) % 60).padStart(2, '0')}
        </strong>

        {completedEarly && (
          <p className="timer-v5-early-note">
            {tr(
              `You finished early. Only your actual study time was saved (out of ${Math.floor(focusDuration / 60)} planned minutes). The full Pomodoro was not counted.`,
              `زووتر تەواوت کرد. تەنها کاتی ڕاستەقینەی خوێندنت پاشەکەوت کرا (لە کۆی ${Math.floor(focusDuration / 60)} خولەکی پلانکراو). وەک پۆمۆدۆرۆی تەواو هەژمار نەکرا.`,
            )}
          </p>
        )}

        {!completedEarly && (
        <p>
          {interruptionCount}{' '}
          {t('interruptions')} ·{' '}
          {pauseMinutes}m{' '}
          {pauseSecs}s{' '}
          {t('paused')}
        </p>
        )}

        <div className="timer-v5-actions">
          <button
            type="button"
            className="cyber-btn"
            onClick={() =>
              startBreak(
                canTakeLongBreak
                  ? 'longBreak'
                  : 'shortBreak',
              )
            }
          >
            <Coffee size={16} />
            {canTakeLongBreak
              ? t('takeLongBreak')
              : t('takeShortBreak')}
          </button>

          <button
            type="button"
            className="timer-v5-secondary"
            onClick={resetTimer}
          >
            <RotateCcw size={16} />
            {t('newSequence')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="timer-v5"
      style={
        {
          '--timer-color':
            timerColor,
        } as CSSProperties
      }
    >
      <div className="timer-v5-status">
        <span className="timer-v5-status-dot" />
        <strong>
          {isFocus
            ? `${t('focus')} · ${completedFocusSessions}/${sessionsBeforeLongBreak}`
            : mode ===
                'shortBreak'
              ? t('shortBreak')
              : t('longBreak')}
        </strong>
      </div>

      {isFocus &&
        !isStudying &&
        !isPaused &&
        timeRemaining ===
          duration && (
          <div className="timer-v5-duration">
            <DurationSelector
              duration={
                focusDuration
              }
              onSelect={
                handleDurationChange
              }
              disabled={
                isStudying ||
                isPaused
              }
            />
          </div>
        )}

      <div className="timer-v5-ring">
        <svg
          viewBox="0 0 340 340"
          aria-hidden="true"
        >
          <circle
            cx="170"
            cy="170"
            r="135"
            className="timer-v5-ring-track"
          />

          <circle
            cx="170"
            cy="170"
            r="135"
            className="timer-v5-ring-progress"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              dashOffset
            }
          />
        </svg>

        <div className="timer-v5-center">
          <strong className="mono timer-v5-time">
            {displayTime}
          </strong>

          <span className="timer-v5-mode">
            {modeLabel}
          </span>

          {isPaused && (
            <span className="mono timer-v5-paused">
              {t('paused')} ·{' '}
              {pauseMinutes}
              {language === 'ku'
                ? ' خولەک '
                : 'm '}
              {pauseSecs}
              {language === 'ku'
                ? ' چرکە'
                : 's'}
            </span>
          )}

          {isFocus &&
            !isStudying &&
            !isPaused &&
            timeRemaining <
              duration &&
            timeRemaining >
              0 && (
              <span className="mono timer-v5-focused">
                {Math.floor(
                  focusedSeconds /
                    60,
                )}
                {language === 'ku'
                  ? ' خولەک '
                  : 'm '}
                {focusedSeconds %
                  60}
                {language === 'ku'
                  ? ' چرکە '
                  : 's '}
                {t('focused')}
              </span>
            )}
        </div>
      </div>

      <div className="timer-v5-actions">
        {!isStudying &&
        !isPaused &&
        timeRemaining ===
          duration ? (
          <button
            type="button"
            className="cyber-btn timer-v5-primary"
            onClick={
              startTimer
            }
          >
            <Play size={16} />
            {isFocus
              ? tr('Start focus', 'دەستپێکردنی سەرنج')
              : t(
                  'startBreak',
                )}
          </button>
        ) : isPaused ? (
          <button
            type="button"
            className="cyber-btn timer-v5-primary"
            onClick={
              resumeTimer
            }
          >
            <Play size={16} />
            {t('resume')}
          </button>
        ) : !isStudying &&
          timeRemaining >
            0 ? (
          <button
            type="button"
            className="cyber-btn timer-v5-primary"
            onClick={
              startTimer
            }
          >
            <Play size={16} />
            {t('resume')}
          </button>
        ) : (
          <button
            type="button"
            className="timer-v5-secondary pause"
            onClick={
              pauseTimer
            }
          >
            <Pause size={16} />
            {t('pause')}
          </button>
        )}

        {!isStudying &&
          timeRemaining <
            duration &&
          timeRemaining >
            0 && (
          <button
            type="button"
            className="timer-v5-secondary"
            onClick={
              resetTimer
            }
          >
            <RotateCcw size={16} />
            {t('reset')}
          </button>
        )}

        {isFocus && (isStudying || isPaused) && !showEarlyFinishConfirm && (
          <button
            type="button"
            className="timer-v5-secondary timer-v5-finish-early"
            onClick={() => setShowEarlyFinishConfirm(true)}
          >
            <Check size={16} />
            {tr('Finish early', 'زووتر تەواوکردن')}
          </button>
        )}
      </div>

      {isFocus && (isStudying || isPaused) && showEarlyFinishConfirm && (
        <div className="timer-v5-early-confirm" role="group"
          aria-label={tr('Confirm early finish', 'پشتڕاستکردنەوەی تەواوکردنی زوو')}
        >
          <strong>{tr('Finished your subject?', 'بابەتەکەت تەواو کرد؟')}</strong>
          <p>
            {tr(
              'Save the time you actually studied and end this timer. The unused minutes will not count.',
              'تەنها ئەو کاتەی بەڕاستی خوێندووتە پاشەکەوت بکە و کاتژمێرەکە کۆتایی پێ بهێنە. خولەکە بەکارنەهاتووەکان هەژمار ناکرێن.',
            )}
          </p>
          <div className="timer-v5-early-confirm-actions">
            <button type="button" className="timer-v5-secondary"
              onClick={() => setShowEarlyFinishConfirm(false)}
            >
              {tr('Keep studying', 'بەردەوام بە لە خوێندن')}
            </button>
            <button type="button" className="cyber-btn"
              onClick={handleFinishEarly}
            >
              <Check size={16} />
              {tr('Finish & save', 'تەواوکردن و پاشەکەوتکردن')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
