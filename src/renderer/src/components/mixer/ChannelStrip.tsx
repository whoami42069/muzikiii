import { useCallback, useEffect, useState } from 'react'
import type { Track } from '../../types'
import { useTracksStore } from '../../store'
import { useAudioEngine } from '../../hooks'
import { audioEngine } from '../../audio/engine'
import { VUMeter } from './VUMeter'

interface ChannelStripProps {
  track: Track
  isSelected: boolean
  onSelect: () => void
}

export function ChannelStrip({
  track,
  isSelected,
  onSelect
}: ChannelStripProps): React.JSX.Element {
  const { toggleMute, toggleSolo, setVolume, setPan } = useTracksStore()
  const { setTrackVolume, setTrackPan, setTrackMute, setTrackSolo } = useAudioEngine()
  const [level, setLevel] = useState(-60)

  // Update level meter
  useEffect(() => {
    const updateLevel = (): void => {
      const trackLevel = audioEngine.getTrackLevel(track.id)
      setLevel(trackLevel)
    }

    const intervalId = setInterval(updateLevel, 50)
    return () => clearInterval(intervalId)
  }, [track.id])

  // Handle volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(track.id, newVolume)
      // Pass linear value directly - engine.ts handles dB conversion
      setTrackVolume(track.id, newVolume)
    },
    [track.id, setVolume, setTrackVolume]
  )

  // Handle pan change
  const handlePanChange = useCallback(
    (newPan: number) => {
      setPan(track.id, newPan)
      setTrackPan(track.id, newPan)
    },
    [track.id, setPan, setTrackPan]
  )

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    toggleMute(track.id)
    setTrackMute(track.id, !track.muted)
  }, [track.id, track.muted, toggleMute, setTrackMute])

  // Handle solo toggle
  const handleSoloToggle = useCallback(() => {
    toggleSolo(track.id)
    setTrackSolo(track.id, !track.solo)
  }, [track.id, track.solo, toggleSolo, setTrackSolo])

  // Format volume as dB
  const volumeDb = track.volume > 0 ? (20 * Math.log10(track.volume)).toFixed(1) : '-∞'

  // Format pan
  const panLabel =
    track.pan === 0
      ? 'C'
      : track.pan < 0
        ? `L${Math.abs(Math.round(track.pan * 100))}`
        : `R${Math.round(track.pan * 100)}`

  return (
    <div
      onClick={onSelect}
      className={`
        flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-daw-accent ring-1 ring-daw-highlight' : 'bg-daw-surface hover:bg-daw-accent/50'}
      `}
      style={{ width: 70 }}
    >
      {/* Track Color & Name */}
      <div className="w-full mb-2">
        <div className="h-1 rounded-full mb-1" style={{ backgroundColor: track.color }} />
        <div className="text-[10px] text-center truncate font-medium" title={track.metadata.title}>
          {track.metadata.title.substring(0, 8)}
        </div>
      </div>

      {/* Mute/Solo Buttons */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleMuteToggle()
          }}
          className={`
            w-6 h-5 text-[10px] font-bold rounded transition-colors
            ${track.muted ? 'bg-red-500 text-white' : 'bg-daw-bg text-daw-muted hover:text-daw-text'}
          `}
          title="Mute"
        >
          M
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSoloToggle()
          }}
          className={`
            w-6 h-5 text-[10px] font-bold rounded transition-colors
            ${track.solo ? 'bg-yellow-500 text-black' : 'bg-daw-bg text-daw-muted hover:text-daw-text'}
          `}
          title="Solo"
        >
          S
        </button>
      </div>

      {/* Pan Knob */}
      <div className="mb-2 w-full">
        <div className="text-[9px] text-daw-muted text-center mb-0.5">PAN</div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => handlePanChange(parseFloat(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handlePanChange(0)
          }}
          className="w-full h-1 bg-daw-bg rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-2
                     [&::-webkit-slider-thumb]:h-2
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-daw-highlight"
          title={`Pan: ${panLabel}`}
        />
        <div className="text-[9px] text-daw-muted text-center">{panLabel}</div>
      </div>

      {/* Fader + Meter Row */}
      <div className="flex gap-1 items-end">
        {/* Volume Fader */}
        <div className="flex flex-col items-center">
          <input
            type="range"
            min="0"
            max="1.25"
            step="0.01"
            value={track.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleVolumeChange(0.8) // Reset to 0dB
            }}
            className="h-20 w-3 bg-daw-bg rounded appearance-none cursor-pointer
                       [writing-mode:vertical-lr] [direction:rtl]
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded
                       [&::-webkit-slider-thumb]:bg-daw-highlight
                       [&::-webkit-slider-thumb]:shadow-md"
            style={{
              background: `linear-gradient(to top, ${track.color} ${(track.volume / 1.25) * 100}%, var(--daw-bg) ${(track.volume / 1.25) * 100}%)`
            }}
            title={`Volume: ${volumeDb} dB`}
          />
        </div>

        {/* VU Meter */}
        <VUMeter level={level} height={80} width={8} />
      </div>

      {/* Volume Label */}
      <div className="text-[9px] text-daw-muted mt-1">{volumeDb} dB</div>
    </div>
  )
}
