import * as Tone from 'tone'
import type { ChorusParams } from '../../types'

/**
 * Chorus effect wrapper
 * Uses Tone.Chorus for pitch modulation and widening
 */
export class ChorusEffect {
  private chorus: Tone.Chorus
  private wetGain: Tone.Gain
  private dryGain: Tone.Gain
  private input: Tone.Gain
  private output: Tone.Gain
  private params: ChorusParams

  constructor() {
    // Create chorus instance
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7
    })

    // Start the LFO (required for chorus to work)
    this.chorus.start()

    // Create wet/dry mix
    this.wetGain = new Tone.Gain(0.5)
    this.dryGain = new Tone.Gain(0.5)
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    // Connect signal chain: input -> [dry + (chorus -> wet)] -> output
    this.input.connect(this.dryGain)
    this.input.connect(this.chorus)
    this.chorus.connect(this.wetGain)
    this.dryGain.connect(this.output)
    this.wetGain.connect(this.output)

    // Initialize params
    this.params = {
      enabled: false,
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
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
   * Set LFO frequency (0.1-10 Hz)
   */
  setFrequency(frequency: number): void {
    this.params.frequency = Math.max(0.1, Math.min(10, frequency))
    this.chorus.frequency.value = this.params.frequency
  }

  /**
   * Set delay time (2-20 ms)
   */
  setDelayTime(delayTime: number): void {
    this.params.delayTime = Math.max(2, Math.min(20, delayTime))
    this.chorus.delayTime = this.params.delayTime
  }

  /**
   * Set modulation depth (0-1)
   */
  setDepth(depth: number): void {
    this.params.depth = Math.max(0, Math.min(1, depth))
    this.chorus.depth = this.params.depth
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
  getParams(): ChorusParams {
    return { ...this.params }
  }

  /**
   * Set all parameters at once
   */
  setParams(params: Partial<ChorusParams>): void {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled)
    }
    if (params.frequency !== undefined) {
      this.setFrequency(params.frequency)
    }
    if (params.delayTime !== undefined) {
      this.setDelayTime(params.delayTime)
    }
    if (params.depth !== undefined) {
      this.setDepth(params.depth)
    }
    if (params.wet !== undefined) {
      this.setWet(params.wet)
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.chorus.stop()
    this.chorus.dispose()
    this.wetGain.dispose()
    this.dryGain.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
