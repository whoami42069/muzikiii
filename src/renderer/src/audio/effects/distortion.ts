import * as Tone from 'tone'
import type { DistortionParams } from '../../types'

/**
 * Distortion effect wrapper
 * Uses Tone.Distortion for harmonic saturation/overdrive
 */
export class DistortionEffect {
  private distortion: Tone.Distortion
  private wetGain: Tone.Gain
  private dryGain: Tone.Gain
  private input: Tone.Gain
  private output: Tone.Gain
  private params: DistortionParams

  constructor() {
    // Create distortion instance
    this.distortion = new Tone.Distortion({
      distortion: 0.4,
      oversample: 'none'
    })

    // Create wet/dry mix
    this.wetGain = new Tone.Gain(0.5)
    this.dryGain = new Tone.Gain(0.5)
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    // Connect signal chain: input -> [dry + (distortion -> wet)] -> output
    this.input.connect(this.dryGain)
    this.input.connect(this.distortion)
    this.distortion.connect(this.wetGain)
    this.dryGain.connect(this.output)
    this.wetGain.connect(this.output)

    // Initialize params
    this.params = {
      enabled: false,
      distortion: 0.4,
      oversample: 'none',
      wet: 0.5
    }
  }

  /**
   * Get input node for connection
   */
  getInput(): Tone.Gain {
    return this.input
  }

  /**
   * Get output node for connection
   */
  getOutput(): Tone.Gain {
    return this.output
  }

  /**
   * Enable or disable the effect
   */
  setEnabled(enabled: boolean): void {
    this.params.enabled = enabled
    if (enabled) {
      this.wetGain.gain.value = this.params.wet
      this.dryGain.gain.value = 1 - this.params.wet
    } else {
      this.wetGain.gain.value = 0
      this.dryGain.gain.value = 1
    }
  }

  /**
   * Set distortion amount (0-1)
   */
  setDistortion(distortion: number): void {
    this.params.distortion = Math.max(0, Math.min(1, distortion))
    this.distortion.distortion = this.params.distortion
  }

  /**
   * Set oversampling ('none' | '2x' | '4x')
   */
  setOversample(oversample: 'none' | '2x' | '4x'): void {
    this.params.oversample = oversample
    this.distortion.oversample = oversample
  }

  /**
   * Set wet/dry mix (0-1)
   */
  setWet(wet: number): void {
    this.params.wet = Math.max(0, Math.min(1, wet))
    if (this.params.enabled) {
      this.wetGain.gain.value = this.params.wet
      this.dryGain.gain.value = 1 - this.params.wet
    }
  }

  /**
   * Get current parameters
   */
  getParams(): DistortionParams {
    return { ...this.params }
  }

  /**
   * Set all parameters at once
   */
  setParams(params: Partial<DistortionParams>): void {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled)
    }
    if (params.distortion !== undefined) {
      this.setDistortion(params.distortion)
    }
    if (params.oversample !== undefined) {
      this.setOversample(params.oversample)
    }
    if (params.wet !== undefined) {
      this.setWet(params.wet)
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.distortion.dispose()
    this.wetGain.dispose()
    this.dryGain.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
