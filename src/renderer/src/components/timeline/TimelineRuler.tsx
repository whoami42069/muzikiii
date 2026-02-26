interface TimelineRulerProps {
  duration: number
  pixelsPerSecond: number
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function TimelineRuler({
  duration,
  pixelsPerSecond,
  onClick
}: TimelineRulerProps): React.JSX.Element {
  const totalWidth = Math.max(duration * pixelsPerSecond, 1000)

  // Calculate marker intervals based on zoom level
  const getInterval = (): number => {
    if (pixelsPerSecond > 200) return 0.5 // Half second
    if (pixelsPerSecond > 100) return 1 // 1 second
    if (pixelsPerSecond > 50) return 2 // 2 seconds
    if (pixelsPerSecond > 25) return 5 // 5 seconds
    if (pixelsPerSecond > 10) return 10 // 10 seconds
    return 30 // 30 seconds
  }

  const interval = getInterval()
  const markers: number[] = []

  for (let t = 0; t <= Math.max(duration, 60); t += interval) {
    markers.push(t)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  return (
    <div
      className="h-6 bg-daw-accent/20 border-b border-daw-accent/30 relative cursor-pointer sticky top-0 z-10"
      style={{ width: totalWidth }}
      onClick={onClick}
    >
      {markers.map((time) => (
        <div
          key={time}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: time * pixelsPerSecond }}
        >
          {/* Major tick */}
          <div className="w-px h-3 bg-daw-muted" />
          {/* Time label */}
          <span className="text-[10px] text-daw-muted mt-0.5 transform -translate-x-1/2">
            {formatTime(time)}
          </span>
        </div>
      ))}

      {/* Minor ticks (subdivisions) */}
      {interval >= 1 &&
        markers.slice(0, -1).map((time) => {
          const subInterval = interval / 4
          const subMarkers: number[] = []
          for (let i = 1; i < 4; i++) {
            subMarkers.push(time + i * subInterval)
          }
          return subMarkers.map((subTime) => (
            <div
              key={subTime}
              className="absolute top-0 w-px h-1.5 bg-daw-muted/50"
              style={{ left: subTime * pixelsPerSecond }}
            />
          ))
        })}
    </div>
  )
}
