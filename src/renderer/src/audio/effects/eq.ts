import * as Tone from 'tone'
import type { EQParams } from '../../types'

/**
 * EQ effect wrapper
 * Uses Tone.EQ3 for 3-band equalization
 */
export class EQEffect {
  private eq: Tone.EQ3
  private input: Tone.Gain
  private output: Tone.Gain
  private params: EQParams
  private bypassed: boolean = false

  constructor() {
    // Create EQ instance
    this.eq = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 300,
      highFrequency: 3000
    })

    // Create input/output nodes
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    // Connect signal chain: input -> eq -> output
    this.input.connect(this.eq)
    this.eq.connect(this.output)

    // Initialize params
    this.params = {
      enabled: false,
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 300,
      highFrequency: 3000,
      wet: 1 // EQ is typically 100% wet when enabled
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
    this.bypassed = !enabled

    if (this.bypassed) {
      // Reset to flat response when disabled
      this.eq.low.value = 0
      this.eq.mid.value = 0
      this.eq.high.value = 0
    } else {
      // Restore current settings
      this.eq.low.value = this.params.low
      this.eq.mid.value = this.params.mid
      this.eq.high.value = this.params.high
    }
  }

  /**
   * Set low frequency gain (-12 to +12 dB)
   */
  setLow(low: number): void {
    this.params.low = Math.max(-12, Math.min(12, low))
    if (!this.bypassed) {
      this.eq.low.value = this.params.low
    }
  }

  /**
   * Set mid frequency gain (-12 to +12 dB)
   */
  setMid(mid: number): void {
    this.params.mid = Math.max(-12, Math.min(12, mid))
    if (!this.bypassed) {
      this.eq.mid.value = this.params.mid
    }
  }

  /**
   * Set high frequency gain (-12 to +12 dB)
   */
  setHigh(high: number): void {
    this.params.high = Math.max(-12, Math.min(12, high))
    if (!this.bypassed) {
      this.eq.high.value = this.params.high
    }
  }

  /**
   * Set low/mid crossover frequency (60-800 Hz)
   * Extended range allows proper bass shaping (bass fundamental ~40Hz)
   */
  setLowFrequency(freq: number): void {
    this.params.lowFrequency = Math.max(60, Math.min(800, freq))
    this.eq.lowFrequency.value = this.params.lowFrequency
  }

  /**
   * Set mid/high crossover frequency (800-12000 Hz)
   * Extended range for presence and air control
   */
  setHighFrequency(freq: number): void {
    this.params.highFrequency = Math.max(800, Math.min(12000, freq))
    this.eq.highFrequency.value = this.params.highFrequency
  }

  /**
   * Get current parameters
   */
  getParams(): EQParams {
    return { ...this.params }
  }

  /**
   * Set all parameters at once
   */
  setParams(params: Partial<EQParams>): void {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled)
    }
    if (params.low !== undefined) {
      this.setLow(params.low)
    }
    if (params.mid !== undefined) {
      this.setMid(params.mid)
    }
    if (params.high !== undefined) {
      this.setHigh(params.high)
    }
    if (params.lowFrequency !== undefined) {
      this.setLowFrequency(params.lowFrequency)
    }
    if (params.highFrequency !== undefined) {
      this.setHighFrequency(params.highFrequency)
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.eq.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
