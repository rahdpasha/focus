import { useEffect, useState, type CSSProperties } from 'react'
import { useTheme } from '../../app/useTheme'

// Stable positions: no random layout shifts or animation-driven React renders.
const STARS = Array.from({ length: 26 }, (_, index) => ({
  left: (9 + index * 37.7) % 97,
  top: (13 + index * 29.3) % 91,
  size: index % 7 === 0 ? 2.5 : index % 3 === 0 ? 1.8 : 1.25,
  delay: -((index * 13) % 29),
  drift: 24 + (index % 6) * 5,
  twinkle: 3.4 + (index % 5) * 1.1,
}))

export default function LivingBackground() {
  const { motion } = useTheme()
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return (
    <div
      className="living-background"
      data-motion={motion}
      data-paused={hidden}
      aria-hidden="true"
    >
      <div className="ambient-haze ambient-haze-one" />
      <div className="ambient-haze ambient-haze-two" />
      <div className="ambient-starfield">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="ambient-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              '--star-size': `${star.size}px`,
              '--star-delay': `${star.delay}s`,
              '--star-duration': `${star.drift}s`,
              '--twinkle-duration': `${star.twinkle}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
