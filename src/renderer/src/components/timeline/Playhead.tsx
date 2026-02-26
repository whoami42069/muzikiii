interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
}

export function Playhead({
  currentTime,
  pixelsPerSecond,
}: PlayheadProps): React.JSX.Element {
  const position = currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-daw-highlight z-20 pointer-events-none"
      style={{ left: position }}
    >
      {/* Playhead marker */}
      <div
        className="absolute -top-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #e94560',
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute top-0 bottom-0 w-1 -left-0.5 opacity-30"
        style={{
          background: 'linear-gradient(to right, transparent, #e94560, transparent)',
        }}
      />
    </div>
  );
}
