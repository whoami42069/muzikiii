import {
  ReverbEffect,
  DelayEffect,
  EQEffect,
  DistortionEffect,
  ChorusEffect,
  CompressorEffect
} from './effects'

export interface EffectInstances {
  reverb: ReverbEffect
  delay: DelayEffect
  eq: EQEffect
  distortion: DistortionEffect
  chorus: ChorusEffect
  compressor: CompressorEffect
}

let instances: EffectInstances | null = null

/**
 * Lazily create and return effect instances.
 * Effects are only instantiated on first access, ensuring AudioContext is ready.
 */
export function getEffectInstances(): EffectInstances {
  if (!instances) {
    instances = {
      reverb: new ReverbEffect(),
      delay: new DelayEffect(),
      eq: new EQEffect(),
      distortion: new DistortionEffect(),
      chorus: new ChorusEffect(),
      compressor: new CompressorEffect()
    }
    console.log('[Effects] Instances created (lazy)')
  }
  return instances
}

/**
 * Dispose all effect instances and reset.
 */
export function disposeEffectInstances(): void {
  if (instances) {
    instances.reverb.dispose()
    instances.delay.dispose()
    instances.eq.dispose()
    instances.distortion.dispose()
    instances.chorus.dispose()
    instances.compressor.dispose()
    instances = null
    console.log('[Effects] Instances disposed')
  }
}
