import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
} from 'lucide-react'
import DurationSelector from './DurationSelector'
import { useI18n } from '../../useI18n'

interface TimerProps {
  subjectName: string
  subjectColor: string

  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean

  onComplete: () => void
  onSessionStart?: (startedAt: Date) => void
  initialFocusMinutes?: number

  onSessionEnd: (
    duration: number,
    actualDuration: number,
    completed: boolean,
    interruptions: number,
    totalPausedSeconds: number,
    startedAt: Date
  ) => void
}

type TimerMode =
  | 'focus'
  | 'shortBreak'
  | 'longBreak'

export default function Timer({
  subjectName,
  subjectColor,
  shortBreakMinutes,
  longBreakMinutes,
  sessionsBeforeLongBreak,
  autoStartBreak,
  soundEnabled,
  soundVolume,
  notificationsEnabled,
  onComplete,
  onSessionStart,
  onSessionEnd,
  initialFocusMinutes = 25,
}: TimerProps) {
  const { language, t, tr } = useI18n()

  const initialSeconds = Math.max(1, initialFocusMinutes) * 60
  const [focusDuration, setFocusDuration] = useState(initialSeconds)
  const [duration, setDuration] = useState(initialSeconds)
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)

  const [mode, setMode] =
    useState<TimerMode>('focus')

  const [
    completedFocusSessions,
    setCompletedFocusSessions,
  ] = useState(0)

  const [isStudying, setIsStudying] =
    useState(false)

  const [isPaused, setIsPaused] =
    useState(false)

  const [isCompleted, setIsCompleted] =
    useState(false)

  const [showComplete, setShowComplete] =
    useState(false)

  const [
    completionCountdown,
    setCompletionCountdown,
  ] = useState(0)

  const completionTimeoutRef =
    useRef<number | null>(null)

  const [pausedSeconds, setPausedSeconds] =
    useState(0)

  const [interruptionCount, setInterruptionCount] =
    useState(0)

  const intervalRef =
    useRef<number | null>(null)

  const pauseIntervalRef =
    useRef<number | null>(null)

  const timerEndRef =
    useRef<number | null>(null)

  const finishedRef =
    useRef(false)

  const sessionStartedAtRef =
    useRef<Date | null>(null)

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

  const durationMinutes =
    Math.floor(duration / 60)

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

    if (
      pauseIntervalRef.current !== null
    ) {
      clearInterval(
        pauseIntervalRef.current
      )

      pauseIntervalRef.current = null
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

      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
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
    finishedRef.current = false
    sessionStartedAtRef.current = null
  }, [])

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

    resetTracking()
  }

  const startTimer = () => {
    if (timeRemaining <= 0) {
      return
    }

    if (
      notificationsEnabled &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      void Notification.requestPermission()
    }

    timerEndRef.current =
      Date.now() +
      timeRemaining * 1000

    if (isFocus && sessionStartedAtRef.current === null) {
      const startedAt = new Date()
      sessionStartedAtRef.current = startedAt
      onSessionStart?.(startedAt)
    }

    setIsStudying(true)
    setIsPaused(false)
    setIsCompleted(false)
    setShowComplete(false)
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

    if (isFocus) {
      setInterruptionCount(
        (count) => count + 1
      )
    }

    if (
      pauseIntervalRef.current === null
    ) {
      pauseIntervalRef.current =
        window.setInterval(() => {
          setPausedSeconds(
            (value) => value + 1
          )
        }, 1000)
    }
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

    if (
      pauseIntervalRef.current !== null
    ) {
      clearInterval(
        pauseIntervalRef.current
      )

      pauseIntervalRef.current = null
    }
  }

  const resetTimer = () => {
    clearTimer()

    setIsStudying(false)
    setIsPaused(false)
    setIsCompleted(false)
    setShowComplete(false)

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

      onComplete()

      

      onSessionEnd(
        focusDuration,
        actualDuration,
        true,
        interruptionCount,
        pausedSeconds,
        sessionStartedAtRef.current ?? new Date()
      )

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
    ])

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
      clearTimer()

      setCompletionCountdown(3)

      let count = 3

      const countdown = () => {
        count -= 1

        if (count <= 0) {
          completionTimeoutRef.current = null
          setCompletionCountdown(0)

          if (isFocus) {
            finishFocusSession()
          } else {
            finishBreak()
          }

          finishedRef.current = false
          return
        }

        setCompletionCountdown(count)

        completionTimeoutRef.current =
          window.setTimeout(
            countdown,
            1000
          )
      }

      completionTimeoutRef.current =
        window.setTimeout(
          countdown,
          1000
        )
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

    return () => {
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
    if (!showComplete) {
      return
    }

    if (!isFocus) {
      return
    }

    if (!autoStartBreak) {
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
    completedFocusSessions,
    sessionsBeforeLongBreak,
    startBreak,
  ])

  useEffect(() => {
    return () => {
      clearTimer()

      if (
        completionTimeoutRef.current !== null
      ) {
        clearTimeout(
          completionTimeoutRef.current
        )
      }
    }
  }, [clearTimer])

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

  if (completionCountdown > 0) {
    return (
      <div className="timer-v5-completion-countdown">
        <span>
          {isFocus
            ? t('sequenceComplete')
            : t('breakComplete')}
        </span>

        <strong className="mono">
          {completionCountdown}
        </strong>
      </div>
    )
  }

  if (
    showComplete &&
    isFocus &&
    !autoStartBreak
  ) {
    return (
      <div className="timer-v5-complete">
        <div className="timer-v5-complete-mark">
          ✓
        </div>

        <div>
          <span className="eyebrow">
            {tr('Session complete', 'سێشن تەواو بوو')}
          </span>
          <h2>
            {tr(`${subjectName} is done.`, `${subjectName} تەواو بوو.`)}
          </h2>
        </div>

        <strong className="mono timer-v5-complete-time">
          {durationMinutes}:
          {String(
            duration % 60,
          ).padStart(2, '0')}
        </strong>

        <p>
          {interruptionCount}{' '}
          {t('interruptions')} ·{' '}
          {pauseMinutes}m{' '}
          {pauseSecs}s{' '}
          {t('paused')}
        </p>

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
            r="154"
            className="timer-v5-ring-outer"
          />

          <circle
            cx="170"
            cy="170"
            r="118"
            className="timer-v5-ring-inner"
          />

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
              ? t(
                  'initiateSequence',
                )
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
      </div>
    </div>
  )
}
