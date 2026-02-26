import * as Tone from 'tone'
import type { ReverbParams } from '../../types'

/**
 * Reverb effect wrapper
 * Uses Tone.Reverb for realistic room/hall simulation
 */
export class ReverbEffect {
  private reverb: Tone.Reverb
  private wetGain: Tone.Gain
  private dryGain: Tone.Gain
  private input: Tone.Gain
  private output: Tone.Gain
  private params: ReverbParams

  constructor() {
    // Create reverb instance
    this.reverb = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.01
    })

    // Create wet/dry mix
    this.wetGain = new Tone.Gain(0.3)
    this.dryGain = new Tone.Gain(0.7)
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    // Connect signal chain: input -> [dry + (reverb -> wet)] -> output
    this.input.connect(this.dryGain)
    this.input.connect(this.reverb)
    this.reverb.connect(this.wetGain)
    this.dryGain.connect(this.output)
    this.wetGain.connect(this.output)

    // Initialize params
    this.params = {
      enabled: false,
      decay: 2.5,
      preDelay: 0.01,
      wet: 0.3
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
   * Set reverb decay time (0.1-30 seconds)
   * Range allows tight rooms (0.1s) to cathedral reverbs (30s)
   */
  async setDecay(decay: number): Promise<void> {
    this.params.decay = Math.max(0.1, Math.min(30, decay))
    // Reverb needs to be regenerated when decay changes
    this.reverb.decay = this.params.decay
    await this.reverb.generate()
  }

  /**
   * Set pre-delay time (0-0.1 seconds)
   */
  async setPreDelay(preDelay: number): Promise<void> {
    this.params.preDelay = Math.max(0, Math.min(0.1, preDelay))
    this.reverb.preDelay = this.params.preDelay
    await this.reverb.generate()
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
  getParams(): ReverbParams {
    return { ...this.params }
  }

  /**
   * Set all parameters at once
   */
  async setParams(params: Partial<ReverbParams>): Promise<void> {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled)
    }
    if (params.decay !== undefined) {
      await this.setDecay(params.decay)
    }
    if (params.preDelay !== undefined) {
      await this.setPreDelay(params.preDelay)
    }
    if (params.wet !== undefined) {
      this.setWet(params.wet)
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.reverb.dispose()
    this.wetGain.dispose()
    this.dryGain.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
