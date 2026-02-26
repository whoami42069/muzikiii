import { useEffect, useRef, useCallback } from 'react'
import { audioEngine } from '../../audio/engine'

interface SpectrumAnalyzerProps {
  height?: number
  colorMode?: 'classic' | 'rainbow' | 'gradient'
  showPeaks?: boolean
  showScale?: boolean
}

// Color schemes for the spectrum
const COLOR_SCHEMES = {
  classic: ['#22c55e', '#22c55e', '#eab308', '#f97316', '#ef4444'],
  rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
  gradient: ['#ff6b6b', '#f39c12', '#4ecdc4', '#45b7d1', '#9b59b6']
}

export function SpectrumAnalyzer({
  height = 100,
  colorMode = 'gradient',
  showPeaks = true
}: SpectrumAnalyzerProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const peaksRef = useRef<number[]>([])
  const peakDecayRef = useRef<number[]>([])
  const drawRef = useRef<(() => void) | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.offsetWidth
    const canvasHeight = canvas.offsetHeight

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, canvasHeight)

    // Get frequency data from audio engine
    let frequencyData: Float32Array
    if (audioEngine.isInitialized()) {
      frequencyData = audioEngine.getFrequencyData()
    } else {
      // Demo data when not connected
      const time = Date.now() / 1000
      frequencyData = new Float32Array(128)
      for (let i = 0; i < frequencyData.length; i++) {
        const freq = i / frequencyData.length
        frequencyData[i] =
          -30 + Math.sin(time * 2 + freq * 10) * 20 + Math.sin(time * 3 + freq * 5) * 15
      }
    }

    // Number of bars to display
    const barCount = 64
    const barWidth = width / barCount - 2
    const colors = COLOR_SCHEMES[colorMode]

    // Initialize peaks array if needed
    if (peaksRef.current.length !== barCount) {
      peaksRef.current = new Array(barCount).fill(0)
      peakDecayRef.current = new Array(barCount).fill(0)
    }

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      // Map bar index to frequency data
      const dataIndex = Math.floor((i / barCount) * frequencyData.length)
      const value = frequencyData[dataIndex]

      // Convert dB to normalized value (0-1)
      // Tone.js analyser returns values in dB, typically -100 to 0
      const normalizedValue = Math.max(0, Math.min(1, (value + 100) / 100))
      const barHeight = normalizedValue * canvasHeight * 0.9

      // Update peaks
      if (showPeaks) {
        if (barHeight > peaksRef.current[i]) {
          peaksRef.current[i] = barHeight
          peakDecayRef.current[i] = 0
        } else {
          peakDecayRef.current[i] += 0.5
          peaksRef.current[i] = Math.max(0, peaksRef.current[i] - peakDecayRef.current[i])
        }
      }

      // Calculate color based on frequency band
      const colorIndex = Math.floor((i / barCount) * colors.length)
      const color = colors[Math.min(colorIndex, colors.length - 1)]

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - barHeight)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, `${color}88`)

      ctx.fillStyle = gradient
      ctx.fillRect(i * (barWidth + 2) + 1, canvasHeight - barHeight, barWidth, barHeight)

      // Draw peak indicator
      if (showPeaks && peaksRef.current[i] > 2) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(i * (barWidth + 2) + 1, canvasHeight - peaksRef.current[i] - 2, barWidth, 2)
      }
    }

    // Draw reflection
    ctx.globalAlpha = 0.15
    ctx.scale(1, -1)
    ctx.translate(0, -canvasHeight * 2)

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length)
      const value = frequencyData[dataIndex]
      const normalizedValue = Math.max(0, Math.min(1, (value + 100) / 100))
      const barHeight = normalizedValue * canvasHeight * 0.3

      const colorIndex = Math.floor((i / barCount) * colors.length)
      const color = colors[Math.min(colorIndex, colors.length - 1)]

      ctx.fillStyle = color
      ctx.fillRect(i * (barWidth + 2) + 1, canvasHeight - barHeight, barWidth, barHeight)
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1

    // Schedule next frame via ref to avoid self-reference TDZ issue
    animationRef.current = requestAnimationFrame(() => drawRef.current?.())
  }, [colorMode, showPeaks])

  // Keep draw ref in sync
  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  useEffect(() => {
    draw()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return <canvas ref={canvasRef} className="w-full rounded" style={{ height }} />
}
