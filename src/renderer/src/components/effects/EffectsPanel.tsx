import { useState } from 'react'
import type { EffectType, AllEffectParams } from '../../types'
import { useEffectsStore } from '../../store/effectsStore'

interface EffectConfig {
  type: EffectType
  name: string
}

const EFFECTS: EffectConfig[] = [
  { type: 'reverb', name: 'Reverb' },
  { type: 'delay', name: 'Delay' },
  { type: 'eq', name: 'EQ' },
  { type: 'distortion', name: 'Distortion' },
  { type: 'chorus', name: 'Chorus' },
  { type: 'compressor', name: 'Compressor' }
]

export function EffectsPanel(): React.JSX.Element {
  const params = useEffectsStore((state) => state.params)
  const toggleEffect = useEffectsStore((state) => state.toggleEffect)
  const updateReverbParam = useEffectsStore((state) => state.updateReverbParam)
  const updateDelayParam = useEffectsStore((state) => state.updateDelayParam)
  const updateEQParam = useEffectsStore((state) => state.updateEQParam)
  const updateDistortionParam = useEffectsStore((state) => state.updateDistortionParam)
  const updateChorusParam = useEffectsStore((state) => state.updateChorusParam)
  const updateCompressorParam = useEffectsStore((state) => state.updateCompressorParam)

  const [expandedEffect, setExpandedEffect] = useState<EffectType | null>(null)

  const toggleExpanded = (type: EffectType): void => {
    setExpandedEffect(expandedEffect === type ? null : type)
  }

  const updateParam = (type: EffectType, param: string, value: number): void => {
    // Route to the appropriate store action based on effect type
    switch (type) {
      case 'reverb':
        updateReverbParam(param as keyof AllEffectParams['reverb'], value)
        break
      case 'delay':
        updateDelayParam(param as keyof AllEffectParams['delay'], value)
        break
      case 'eq':
        updateEQParam(param as keyof AllEffectParams['eq'], value)
        break
      case 'distortion':
        updateDistortionParam(param as keyof AllEffectParams['distortion'], value)
        break
      case 'chorus':
        updateChorusParam(param as keyof AllEffectParams['chorus'], value)
        break
      case 'compressor':
        updateCompressorParam(param as keyof AllEffectParams['compressor'], value)
        break
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-daw-accent/30">
        <h2 className="text-sm font-semibold text-daw-muted uppercase tracking-wide">Effects</h2>
      </div>

      {/* Effects List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {EFFECTS.map((effect) => (
          <EffectUnit
            key={effect.type}
            effectType={effect.type}
            effectName={effect.name}
            effectParams={params[effect.type]}
            isExpanded={expandedEffect === effect.type}
            onToggle={() => toggleEffect(effect.type)}
            onExpand={() => toggleExpanded(effect.type)}
            onParamChange={(param, value) => updateParam(effect.type, param, value)}
          />
        ))}
      </div>
    </div>
  )
}

interface EffectUnitProps {
  effectType: EffectType
  effectName: string
  effectParams: AllEffectParams[EffectType]
  isExpanded: boolean
  onToggle: () => void
  onExpand: () => void
  onParamChange: (param: string, value: number) => void
}

function EffectUnit({
  effectType,
  effectName,
  effectParams,
  isExpanded,
  onToggle,
  onExpand,
  onParamChange
}: EffectUnitProps): React.JSX.Element {
  // Get display parameters (exclude 'enabled' and 'wet' for most effects)
  const getDisplayParams = (): Array<[string, number]> => {
    const entries = Object.entries(effectParams) as Array<[string, number | string]>
    return entries.filter(([key]) => {
      // Always exclude 'enabled'
      if (key === 'enabled') return false
      // For EQ and Compressor, include 'wet' isn't in params, so show all
      // For others, exclude 'wet' as it's shown differently
      if (effectType === 'eq' || effectType === 'compressor') {
        return key !== 'oversample' // Exclude non-numeric params
      }
      return key !== 'oversample' // Exclude non-numeric params
    }) as Array<[string, number]>
  }

  const displayParams = getDisplayParams()

  return (
    <div
      className={`
        rounded-lg border transition-colors
        ${
          effectParams.enabled
            ? 'bg-daw-accent/30 border-daw-highlight/50'
            : 'bg-daw-surface border-daw-accent/30'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onExpand}>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            title={`${effectName}: ${effectParams.enabled ? 'On' : 'Off'} (click to toggle)`}
            className={`
              w-10 h-5 rounded-full transition-colors relative
              ${effectParams.enabled ? 'bg-daw-highlight' : 'bg-daw-muted'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                ${effectParams.enabled ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
          <span className="font-medium">{effectName}</span>
        </div>
        <span className="text-daw-muted text-sm">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* Parameters */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {displayParams.map(([param, value]) => (
            <div key={param}>
              <div className="flex justify-between text-xs text-daw-muted mb-1">
                <span className="capitalize">{formatParamName(param)}</span>
                <span>{formatParamValue(param, value)}</span>
              </div>
              <input
                type="range"
                min={getParamMin(param)}
                max={getParamMax(param)}
                step={getParamStep(param)}
                value={value}
                onChange={(e) => onParamChange(param, Number(e.target.value))}
                title={`${formatParamName(param)}: ${formatParamValue(param, value)} (double-click to reset)`}
                className="w-full accent-daw-highlight"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper functions for parameter formatting
function formatParamName(param: string): string {
  return param.replace(/([A-Z])/g, ' $1').trim()
}

function formatParamValue(param: string, value: number): string {
  switch (param) {
    case 'decay':
    case 'delayTime':
    case 'attack':
    case 'release':
      return `${value.toFixed(2)}s`
    case 'preDelay':
      return `${(value * 1000).toFixed(0)}ms`
    case 'wet':
    case 'depth':
    case 'distortion':
    case 'feedback':
      return `${Math.round(value * 100)}%`
    case 'frequency':
      return `${value.toFixed(1)}Hz`
    case 'threshold':
      return `${value}dB`
    case 'ratio':
      return `${value}:1`
    case 'low':
    case 'mid':
    case 'high':
      return `${value > 0 ? '+' : ''}${value}dB`
    default:
      return String(value)
  }
}

function getParamMin(param: string): number {
  switch (param) {
    case 'threshold':
      return -60
    case 'low':
    case 'mid':
    case 'high':
      return -12
    default:
      return 0
  }
}

function getParamMax(param: string): number {
  switch (param) {
    case 'decay':
      return 10
    case 'delayTime':
      return 1
    case 'preDelay':
      return 0.1
    case 'wet':
    case 'depth':
    case 'distortion':
      return 1
    case 'feedback':
      return 0.9
    case 'frequency':
      return 10
    case 'threshold':
      return 0
    case 'ratio':
      return 20
    case 'attack':
    case 'release':
      return 1
    case 'low':
    case 'mid':
    case 'high':
      return 12
    default:
      return 100
  }
}

function getParamStep(param: string): number {
  switch (param) {
    case 'preDelay':
      return 0.001
    case 'attack':
    case 'release':
      return 0.001
    case 'threshold':
    case 'low':
    case 'mid':
    case 'high':
      return 1
    case 'ratio':
      return 0.5
    default:
      return 0.01
  }
}
