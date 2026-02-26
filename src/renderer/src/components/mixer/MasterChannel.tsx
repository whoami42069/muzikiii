import { useCallback, useEffect, useState } from 'react'
import { useAudioEngine } from '../../hooks'
import { audioEngine } from '../../audio/engine'
import { StereoVUMeter } from './VUMeter'

export function MasterChannel(): React.JSX.Element {
  const { setMasterVolume } = useAudioEngine()
  const [volume, setVolume] = useState(0.8)
  const [level, setLevel] = useState(-60)

  // Update level meter
  useEffect(() => {
    const updateLevel = (): void => {
      const masterLevel = audioEngine.getLevel()
      setLevel(masterLevel)
    }

    const intervalId = setInterval(updateLevel, 50)
    return () => clearInterval(intervalId)
  }, [])

  // Handle volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)
      // Pass linear value directly - engine.ts handles dB conversion
      setMasterVolume(newVolume)
    },
    [setMasterVolume]
  )

  // Format volume as dB
  const volumeDb = volume > 0 ? (20 * Math.log10(volume)).toFixed(1) : '-∞'

  return (
    <div className="flex flex-col items-center p-3 bg-daw-accent rounded-lg" style={{ width: 90 }}>
      {/* Header */}
      <div className="w-full mb-2">
        <div className="h-1.5 rounded-full mb-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        <div className="text-xs text-center font-bold text-daw-text">MASTER</div>
      </div>

      {/* Spacer for alignment with channel strips */}
      <div className="h-[26px]" />

      {/* Fader + Meter Row */}
      <div className="flex gap-2 items-end">
        {/* Volume Fader */}
        <div className="flex flex-col items-center">
          <input
            type="range"
            min="0"
            max="1.25"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            onDoubleClick={() => handleVolumeChange(0.8)}
            className="h-24 w-4 bg-daw-bg rounded appearance-none cursor-pointer
                       [writing-mode:vertical-lr] [direction:rtl]
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded
                       [&::-webkit-slider-thumb]:bg-gradient-to-r
                       [&::-webkit-slider-thumb]:from-cyan-500
                       [&::-webkit-slider-thumb]:to-blue-500
                       [&::-webkit-slider-thumb]:shadow-lg"
            style={{
              background: `linear-gradient(to top, #0891b2 ${(volume / 1.25) * 100}%, var(--daw-bg) ${(volume / 1.25) * 100}%)`
            }}
            title={`Master Volume: ${volumeDb} dB`}
          />
        </div>

        {/* Stereo VU Meter (simulated as same level for both channels) */}
        <StereoVUMeter leftLevel={level} rightLevel={level * 0.95} height={96} showScale={true} />
      </div>

      {/* Volume Label */}
      <div className="text-xs text-daw-text font-medium mt-2">{volumeDb} dB</div>

      {/* Output Label */}
      <div className="text-[9px] text-daw-muted mt-1">OUT 1-2</div>
    </div>
  )
}
