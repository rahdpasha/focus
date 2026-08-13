import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
} from 'lucide-react'
import DurationSelector from './DurationSelector'

interface TimerProps {
  subjectName: string
  subjectColor: string

  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean

  onComplete: () => void

  onSessionEnd: (
    duration: number,
    actualDuration: number,
    completed: boolean,
    interruptions: number,
    totalPausedSeconds: number
  ) => void
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export default function Timer({
  subjectName,
  subjectColor,
  shortBreakMinutes,
  longBreakMinutes,
  sessionsBeforeLongBreak,
  autoStartBreak,
  onComplete,
  onSessionEnd,
}: TimerProps) {
  const [focusDuration, setFocusDuration] = useState(1500)
  const [duration, setDuration] = useState(1500)
  const [timeRemaining, setTimeRemaining] = useState(1500)

  const [mode, setMode] = useState<TimerMode>('focus')
  const [completedFocusSessions, setCompletedFocusSessions] =
    useState(0)

  const [isStudying, setIsStudying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showComplete, setShowComplete] = useState(false)

  const [pausedSeconds, setPausedSeconds] = useState(0)
  const [interruptionCount, setInterruptionCount] = useState(0)

  const intervalRef = useRef<number | null>(null)
  const pauseIntervalRef = useRef<number | null>(null)
  const finishedRef = useRef(false)

  const isFocus = mode === 'focus'

  const focusedSeconds = Math.max(
    0,
    focusDuration - timeRemaining
  )

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const displayTime =
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`

  const pauseMinutes = Math.floor(pausedSeconds / 60)
  const pauseSecs = pausedSeconds % 60

  const durationMinutes = Math.floor(duration / 60)

  const circumference = 2 * Math.PI * 135

  const progress =
    duration > 0
      ? ((duration - timeRemaining) / duration) * 100
      : 0

  const dashOffset =
    circumference - (progress / 100) * circumference

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (pauseIntervalRef.current !== null) {
      clearInterval(pauseIntervalRef.current)
      pauseIntervalRef.current = null
    }
  }, [])

  const resetTracking = useCallback(() => {
    setPausedSeconds(0)
    setInterruptionCount(0)
    finishedRef.current = false
  }, [])

  const handleDurationChange = (newDuration: number) => {
    if (isStudying || isPaused || !isFocus) {
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
    if (timeRemaining <= 0) return

    setIsStudying(true)
    setIsPaused(false)
    setIsCompleted(false)
    setShowComplete(false)
  }

  const pauseTimer = () => {
    if (!isStudying) return

    setIsStudying(false)
    setIsPaused(true)

    if (isFocus) {
      setInterruptionCount((count) => count + 1)
    }

    if (pauseIntervalRef.current === null) {
      pauseIntervalRef.current = window.setInterval(() => {
        setPausedSeconds((value) => value + 1)
      }, 1000)
    }
  }

  const resumeTimer = () => {
    setIsPaused(false)
    setIsStudying(true)

    if (pauseIntervalRef.current !== null) {
      clearInterval(pauseIntervalRef.current)
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
    (breakMode: 'shortBreak' | 'longBreak') => {
      const breakDuration =
        breakMode === 'longBreak'
          ? longBreakMinutes * 60
          : shortBreakMinutes * 60

      clearTimer()

      setMode(breakMode)
      setDuration(breakDuration)
      setTimeRemaining(breakDuration)

      setIsStudying(false)
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

  const finishFocusSession = useCallback(() => {
    if (finishedRef.current) return

    finishedRef.current = true

    const actualDuration = Math.max(
      0,
      focusDuration - pausedSeconds
    )

    onComplete()

    onSessionEnd(
      focusDuration,
      actualDuration,
      true,
      interruptionCount,
      pausedSeconds
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
    onComplete,
    onSessionEnd,
  ])

  const finishBreak = useCallback(() => {
    const wasLongBreak = mode === 'longBreak'

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
    resetTracking,
  ])

  const handleTimerFinished = useCallback(() => {
    if (finishedRef.current) return

    finishedRef.current = true
    clearTimer()

    if (isFocus) {
      finishedRef.current = false
      finishFocusSession()
    } else {
      finishedRef.current = false
      finishBreak()
    }
  }, [
    clearTimer,
    isFocus,
    finishFocusSession,
    finishBreak,
  ])

  useEffect(() => {
    if (!isStudying) return

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isStudying])

  useEffect(() => {
    if (!isStudying) return
    if (timeRemaining !== 0) return

    const timeout = window.setTimeout(() => {
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
    if (!showComplete) return
    if (!isFocus) return
    if (!autoStartBreak) return

    const nextCount = completedFocusSessions

    const nextBreak =
      nextCount >= sessionsBeforeLongBreak
        ? 'longBreak'
        : 'shortBreak'

    const timeout = window.setTimeout(() => {
      setShowComplete(false)
      startBreak(nextBreak)
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
    }
  }, [clearTimer])

  const getTimerColor = () => {
    if (isCompleted) return 'var(--success)'
    if (isPaused) return 'var(--energy)'

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

  const timerColor = getTimerColor()

  const modeLabel =
    mode === 'focus'
      ? subjectName
      : mode === 'shortBreak'
        ? 'SHORT BREAK'
        : 'LONG BREAK'

  const canTakeLongBreak =
    completedFocusSessions >= sessionsBeforeLongBreak

  if (showComplete && isFocus && !autoStartBreak) {
    return (
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div style={{ fontSize: '56px' }}>
          ⬡
        </div>

        <h2
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '18px',
            color: 'var(--success)',
            letterSpacing: '0.1em',
          }}
        >
          SEQUENCE COMPLETE
        </h2>

        <span
          className="mono"
          style={{
            fontSize: '40px',
            color: 'var(--text-primary)',
          }}
        >
          {durationMinutes}:
          {String(duration % 60).padStart(2, '0')}
        </span>

        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          {subjectName} · {interruptionCount}{' '}
          interruptions · {pauseMinutes}m {pauseSecs}s
          {' '}paused
        </span>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            className="cyber-btn"
            onClick={() =>
              startBreak(
                canTakeLongBreak
                  ? 'longBreak'
                  : 'shortBreak'
              )
            }
          >
            <Coffee size={16} />

            {canTakeLongBreak
              ? 'TAKE LONG BREAK'
              : 'TAKE SHORT BREAK'}
          </button>

          <button
            className="cyber-btn"
            onClick={resetTimer}
          >
            <RotateCcw size={16} />
            NEW SEQUENCE
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          border: `1px solid ${timerColor}40`,
          background: `${timerColor}10`,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: '10px',
            color: timerColor,
            letterSpacing: '0.08em',
          }}
        >
          {isFocus
            ? `FOCUS ${completedFocusSessions}/${sessionsBeforeLongBreak}`
            : mode === 'shortBreak'
              ? 'SHORT BREAK'
              : 'LONG BREAK'}
        </span>
      </div>

      {isFocus &&
        !isStudying &&
        !isPaused &&
        timeRemaining === duration && (
          <DurationSelector
            duration={focusDuration}
            onSelect={handleDurationChange}
            disabled={isStudying || isPaused}
          />
        )}

      <div
        style={{
          position: 'relative',
          width: '340px',
          height: '340px',
          maxWidth: '100%',
        }}
      >
        {isStudying && (
          <svg
            width="340"
            height="340"
            viewBox="0 0 340 340"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              animation:
                'spin-reverse 10s linear infinite',
            }}
          >
            <circle
              cx="170"
              cy="40"
              r="2"
              fill={timerColor}
              opacity="0.6"
            />

            <circle
              cx="300"
              cy="170"
              r="1.5"
              fill={timerColor}
              opacity="0.4"
            />

            <circle
              cx="170"
              cy="300"
              r="2"
              fill={timerColor}
              opacity="0.5"
            />

            <circle
              cx="40"
              cy="170"
              r="1.5"
              fill={timerColor}
              opacity="0.4"
            />
          </svg>
        )}

        <svg
          width="340"
          height="340"
          viewBox="0 0 340 340"
          style={{
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
          }}
        >
          <circle
            cx="170"
            cy="170"
            r="135"
            fill="none"
            stroke="var(--void-border)"
            strokeWidth="3"
            opacity={0.3}
          />

          <circle
            cx="170"
            cy="170"
            r="135"
            fill="none"
            stroke={timerColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition:
                'stroke-dashoffset 1s linear, stroke 0.5s ease',
              filter:
                isStudying || isPaused
                  ? `drop-shadow(0 0 15px ${timerColor}50) drop-shadow(0 0 30px ${timerColor}20)`
                  : 'none',
            }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform:
              'translate(-50%, -50%)',
            textAlign: 'center',
            width: '80%',
          }}
        >
          {(isStudying || isPaused) && (
            <div
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background:
                  `radial-gradient(circle, ${timerColor}20, transparent 70%)`,
                top: '50%',
                left: '50%',
                transform:
                  'translate(-50%, -50%)',
                animation:
                  'pulse-glow 2s ease-in-out infinite',
              }}
            />
          )}

          <span
            className="mono"
            style={{
              fontSize: '56px',
              fontWeight: '500',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textShadow: isStudying
                ? `0 0 30px ${timerColor}40`
                : 'none',
              position: 'relative',
            }}
          >
            {displayTime}
          </span>

          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'Orbitron, sans-serif',
              marginTop: '8px',
            }}
          >
            {modeLabel}
          </span>

          {isPaused && (
            <span
              className="mono"
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--energy)',
                marginTop: '6px',
              }}
            >
              PAUSED · {pauseMinutes}m{' '}
              {pauseSecs}s
            </span>
          )}

          {isFocus &&
            !isStudying &&
            !isPaused &&
            timeRemaining < duration &&
            timeRemaining > 0 && (
              <span
                className="mono"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '6px',
                }}
              >
                {Math.floor(focusedSeconds / 60)}m{' '}
                {focusedSeconds % 60}s focused
              </span>
            )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {!isStudying &&
        !isPaused &&
        timeRemaining === duration ? (
          <button
            className="cyber-btn"
            onClick={startTimer}
          >
            <Play size={16} />
            {isFocus
              ? 'INITIATE SEQUENCE'
              : 'START BREAK'}
          </button>
        ) : isPaused ? (
          <button
            className="cyber-btn"
            onClick={resumeTimer}
          >
            <Play size={16} />
            RESUME
          </button>
        ) : !isStudying &&
          timeRemaining > 0 ? (
          <button
            className="cyber-btn"
            onClick={startTimer}
          >
            <Play size={16} />
            RESUME
          </button>
        ) : (
          <button
            className="cyber-btn"
            onClick={pauseTimer}
            style={{
              borderColor:
                'rgba(245,158,11,0.3)',
              color: 'var(--energy)',
            }}
          >
            <Pause size={16} />
            PAUSE
          </button>
        )}

        {!isStudying &&
          timeRemaining < duration &&
          timeRemaining > 0 && (
            <button
              className="cyber-btn"
              onClick={resetTimer}
            >
              <RotateCcw size={16} />
              RESET
            </button>
          )}
      </div>

      <style>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }

          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}