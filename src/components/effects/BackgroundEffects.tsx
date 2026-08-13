import { useEffect, useRef } from 'react'

export default function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Grid points
    const gridSpacing = 50
    const cols = Math.ceil(canvas.width / gridSpacing) + 1
    const rows = Math.ceil(canvas.height / gridSpacing) + 1
    const points: { x: number; y: number; baseX: number; baseY: number }[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * gridSpacing
        const y = r * gridSpacing
        points.push({ x, y, baseX: x, baseY: y })
      }
    }

    const draw = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Deep dark space
      const bg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8)
      bg.addColorStop(0, '#0c0c22')
      bg.addColorStop(0.5, '#060614')
      bg.addColorStop(1, '#02020a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Large elegant orbs
      const orbs = [
        { x: canvas.width * 0.2, y: canvas.height * 0.35, r: 350, c: 'rgba(100,40,200,0.05)' },
        { x: canvas.width * 0.75, y: canvas.height * 0.55, r: 300, c: 'rgba(6,160,210,0.04)' },
        { x: canvas.width * 0.5, y: canvas.height * 0.25, r: 250, c: 'rgba(80,30,180,0.04)' },
      ]
      orbs.forEach(orb => {
        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        g.addColorStop(0, orb.c)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Animate grid points
      points.forEach((p) => {
        const dx = p.baseX - canvas.width / 2
        const dy = p.baseY - canvas.height / 2
        const dist = Math.sqrt(dx * dx + dy * dy)
        const wave1 = Math.sin(dist * 0.015 - time * 2.5) * 4
        const wave2 = Math.cos(dist * 0.02 + time * 1.8) * 3
        p.x = p.baseX + wave1 * 0.6
        p.y = p.baseY + wave2 * 0.6
      })

      // Draw connections
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const i = r * cols + c
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = points[i + cols]

          const midX = (p1.x + p2.x + p3.x) / 3
          const midY = (p1.y + p2.y + p3.y) / 3
          const dx = midX - canvas.width / 2
          const dy = midY - canvas.height / 2
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = canvas.width * 0.7
          const alpha = Math.max(0, 1 - dist / maxDist) * 0.15

          if (alpha > 0.01) {
            // Color shifts from purple to cyan based on position
            const colorShift = (Math.sin(dist * 0.008 + time * 0.5) + 1) / 2
            const r = Math.floor(80 + colorShift * 60)
            const g = Math.floor(70 + colorShift * 150)
            const b = Math.floor(200 - colorShift * 40)

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.lineWidth = 0.4
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p3.x, p3.y)
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.8})`
            ctx.lineWidth = 0.3
            ctx.stroke()
          }
        }
      }

      // Draw points as tiny glowing dots
      points.forEach(p => {
        const dx = p.x - canvas.width / 2
        const dy = p.y - canvas.height / 2
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = canvas.width * 0.7
        const alpha = Math.max(0, 1 - dist / maxDist) * 0.6

        if (alpha > 0.03) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,160,230,${alpha})`
          ctx.fill()
          
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(139,92,246,${alpha * 0.3})`
          ctx.fill()
        }
      })

      // Floating particles
      const particleCount = 15
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.3
        const radius = 200 + Math.sin(i * 1.7 + time) * 100
        const px = canvas.width / 2 + Math.cos(angle) * radius
        const py = canvas.height / 2 + Math.sin(angle) * radius * 0.6
        const size = 2 + Math.sin(i + time * 2) * 1

        const pg = ctx.createRadialGradient(px, py, 0, px, py, size * 8)
        pg.addColorStop(0, `rgba(180,160,240,${0.4 + Math.sin(i + time) * 0.2})`)
        pg.addColorStop(0.3, 'rgba(139,92,246,0.1)')
        pg.addColorStop(1, 'transparent')
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.arc(px, py, size * 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200,180,255,0.8)'
        ctx.fill()
      }

      // Bottom horizon
      const hg = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height)
      hg.addColorStop(0, 'transparent')
      hg.addColorStop(1, 'rgba(80,40,180,0.05)')
      ctx.fillStyle = hg
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60)

      // Thin glowing horizon line
      ctx.beginPath()
      ctx.moveTo(0, canvas.height - 1)
      ctx.lineTo(canvas.width, canvas.height - 1)
      const lineGrad = ctx.createLinearGradient(0, 0, canvas.width, 0)
      lineGrad.addColorStop(0, 'transparent')
      lineGrad.addColorStop(0.3, 'rgba(139,92,246,0.3)')
      lineGrad.addColorStop(0.5, 'rgba(6,182,212,0.4)')
      lineGrad.addColorStop(0.7, 'rgba(139,92,246,0.3)')
      lineGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = lineGrad
      ctx.lineWidth = 1
      ctx.stroke()

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        opacity: 0.85,
      }}
    />
  )
}