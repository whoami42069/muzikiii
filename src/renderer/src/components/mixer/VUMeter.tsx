import { useEffect, useState, useRef } from 'react'

interface VUMeterProps {
  level: number // Current level in dB
  peakHoldTime?: number // Time to hold peak indicator (ms)
  orientation?: 'vertical' | 'horizontal'
  height?: number
  width?: number
  showScale?: boolean
}

// dB scale marks
const DB_MARKS = [0, -6, -12, -18, -24, -36, -48]
const MIN_DB = -60
const MAX_DB = 6

export function VUMeter({
  level,
  peakHoldTime = 1500,
  orientation = 'vertical',
  height = 120,
  width = 12,
  showScale = false
}: VUMeterProps): React.JSX.Element {
  const [peakLevel, setPeakLevel] = useState(MIN_DB)
  const peakTimeoutRef = useRef<number | null>(null)

  // Update peak hold - use functional state update to avoid stale closure
  useEffect(() => {
    setPeakLevel((prev) => {
      if (level > prev) {
        // Clear existing timeout
        if (peakTimeoutRef.current) {
          clearTimeout(peakTimeoutRef.current)
        }

        // Set new timeout to reset peak
        peakTimeoutRef.current = window.setTimeout(() => {
          setPeakLevel(MIN_DB)
        }, peakHoldTime)

        return level
      }
      return prev
    })
  }, [level, peakHoldTime])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (peakTimeoutRef.current) {
        clearTimeout(peakTimeoutRef.current)
      }
    }
  }, [])

  // Convert dB to percentage (0-100)
  const dbToPercent = (db: number): number => {
    const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db))
    return ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * 100
  }

  // Get color based on level
  const getLevelColor = (db: number): string => {
    if (db > 0) return '#ef4444' // Red (clipping)
    if (db > -6) return '#f97316' // Orange (hot)
    if (db > -12) return '#eab308' // Yellow (warm)
    return '#22c55e' // Green (normal)
  }

  const levelPercent = dbToPercent(level)
  const peakPercent = dbToPercent(peakLevel)
  const levelColor = getLevelColor(level)

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-1">
        <div
          className="relative bg-daw-bg rounded overflow-hidden"
          style={{ width: height, height: width }}
        >
          {/* Level bar */}
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-75"
            style={{
              width: `${levelPercent}%`,
              background: `linear-gradient(to right, #22c55e, ${levelColor})`
            }}
          />
          {/* Peak indicator */}
          {peakLevel > MIN_DB && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white"
              style={{ left: `${peakPercent}%` }}
            />
          )}
        </div>
        {showScale && (
          <span className="text-[10px] text-daw-muted w-8">
            {level > MIN_DB ? `${level.toFixed(0)}` : '-∞'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      {showScale && (
        <div className="flex flex-col justify-between text-[9px] text-daw-muted" style={{ height }}>
          {DB_MARKS.map((db) => (
            <span key={db} className="leading-none">
              {db}
            </span>
          ))}
        </div>
      )}
      <div className="relative bg-daw-bg rounded overflow-hidden" style={{ width, height }}>
        {/* Level bar */}
        <div
          className="absolute left-0 right-0 bottom-0 transition-all duration-75"
          style={{
            height: `${levelPercent}%`,
            background: `linear-gradient(to top, #22c55e 0%, #22c55e 60%, #eab308 80%, ${levelColor} 100%)`
          }}
        />
        {/* Peak indicator */}
        {peakLevel > MIN_DB && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-white"
            style={{ bottom: `${peakPercent}%` }}
          />
        )}
        {/* Clip indicator */}
        {level > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse" />
        )}
      </div>
    </div>
  )
}

// Stereo VU Meter with left and right channels
interface StereoVUMeterProps {
  leftLevel: number
  rightLevel: number
  height?: number
  showScale?: boolean
}

export function StereoVUMeter({
  leftLevel,
  rightLevel,
  height = 120,
  showScale = true
}: StereoVUMeterProps): React.JSX.Element {
  return (
    <div className="flex gap-0.5 items-end">
      {showScale && (
        <div
          className="flex flex-col justify-between text-[9px] text-daw-muted pr-1"
          style={{ height }}
        >
          {DB_MARKS.map((db) => (
            <span key={db} className="leading-none">
              {db}
            </span>
          ))}
        </div>
      )}
      <VUMeter level={leftLevel} height={height} width={8} />
      <VUMeter level={rightLevel} height={height} width={8} />
      <div className="flex flex-col justify-end text-[8px] text-daw-muted pl-0.5">
        <span>L</span>
        <span>R</span>
      </div>
    </div>
  )
}
