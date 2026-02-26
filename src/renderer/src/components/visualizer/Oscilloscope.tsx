import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { audioEngine } from '../../audio/engine'

interface OscilloscopeProps {
  height?: number
  lineColor?: string
  lineWidth?: number
  showGrid?: boolean
  showCenterLine?: boolean
}

export function Oscilloscope({
  height = 100,
  lineColor = '#e94560',
  lineWidth = 2,
  showGrid = true,
  showCenterLine = true
}: OscilloscopeProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const waveformRef = useRef<Tone.Waveform | null>(null)
  const drawRef = useRef<(() => void) | null>(null)

  // Initialize waveform analyzer
  useEffect(() => {
    if (!audioEngine.isInitialized()) return

    // Create waveform analyzer
    const waveform = new Tone.Waveform(1024)

    // Connect to master channel
    const masterChannel = audioEngine.getMasterChannel()
    masterChannel.connect(waveform)

    waveformRef.current = waveform

    return () => {
      waveform.dispose()
      waveformRef.current = null
    }
  }, [])

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.offsetWidth
    const canvasHeight = canvas.offsetHeight

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, canvasHeight)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#2a2a4e'
      ctx.lineWidth = 0.5

      // Vertical grid lines
      const gridSpacingX = width / 10
      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()
      }

      // Horizontal grid lines
      const gridSpacingY = canvasHeight / 4
      for (let y = gridSpacingY; y < canvasHeight; y += gridSpacingY) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    // Draw center line
    if (showCenterLine) {
      ctx.strokeStyle = '#4a4a6e'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, canvasHeight / 2)
      ctx.lineTo(width, canvasHeight / 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Get waveform data
    let waveformData: Float32Array
    if (waveformRef.current) {
      waveformData = waveformRef.current.getValue()
    } else {
      // Generate demo waveform when not connected
      const time = Date.now() / 1000
      waveformData = new Float32Array(1024)
      for (let i = 0; i < waveformData.length; i++) {
        const t = i / waveformData.length
        waveformData[i] =
          Math.sin(time * 5 + t * Math.PI * 4) * 0.3 +
          Math.sin(time * 3 + t * Math.PI * 8) * 0.2 +
          Math.sin(time * 7 + t * Math.PI * 2) * 0.1
      }
    }

    // Draw waveform
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Add glow effect
    ctx.shadowColor = lineColor
    ctx.shadowBlur = 8

    ctx.beginPath()

    const sliceWidth = width / waveformData.length
    let x = 0

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i]
      const y = ((v + 1) / 2) * canvasHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.stroke()

    // Reset shadow
    ctx.shadowBlur = 0

    // Schedule next frame via ref to avoid self-reference TDZ issue
    animationRef.current = requestAnimationFrame(() => drawRef.current?.())
  }, [lineColor, lineWidth, showGrid, showCenterLine])

  // Keep draw ref in sync
  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  // Animation loop
  useEffect(() => {
    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  // Handle resize
  useEffect(() => {
    const handleResize = (): void => {
      // Force redraw on resize
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      draw()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  return <canvas ref={canvasRef} className="w-full rounded" style={{ height }} />
}
