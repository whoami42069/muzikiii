import * as Tone from 'tone'
import type { CompressorParams } from '../../types'

/**
 * Compressor effect wrapper
 * Uses Tone.Compressor for dynamic range control
 */
export class CompressorEffect {
  private compressor: Tone.Compressor
  private input: Tone.Gain
  private output: Tone.Gain
  private params: CompressorParams
  private bypassed: boolean = false

  constructor() {
    // Create compressor instance
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 10
    })

    // Create input/output nodes
    this.input = new Tone.Gain(1)
    this.output = new Tone.Gain(1)

    // Connect signal chain: input -> compressor -> output
    this.input.connect(this.compressor)
    this.compressor.connect(this.output)

    // Initialize params
    this.params = {
      enabled: false,
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 10,
      wet: 1 // Compressor is typically 100% wet when enabled
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
      // Set to no compression when disabled
      this.compressor.threshold.value = 0
      this.compressor.ratio.value = 1
    } else {
      // Restore current settings
      this.compressor.threshold.value = this.params.threshold
      this.compressor.ratio.value = this.params.ratio
    }
  }

  /**
   * Set threshold (-60 to 0 dB)
   */
  setThreshold(threshold: number): void {
    this.params.threshold = Math.max(-60, Math.min(0, threshold))
    if (!this.bypassed) {
      this.compressor.threshold.value = this.params.threshold
    }
  }

  /**
   * Set compression ratio (1-20)
   */
  setRatio(ratio: number): void {
    this.params.ratio = Math.max(1, Math.min(20, ratio))
    if (!this.bypassed) {
      this.compressor.ratio.value = this.params.ratio
    }
  }

  /**
   * Set attack time (0.0001-0.3 seconds / 0.1ms-300ms)
   * Professional range prevents distortion at 0 while allowing fast attack
   */
  setAttack(attack: number): void {
    this.params.attack = Math.max(0.0001, Math.min(0.3, attack))
    this.compressor.attack.value = this.params.attack
  }

  /**
   * Set release time (0.01-3 seconds / 10ms-3s)
   * Extended range for natural-sounding compression on various material
   */
  setRelease(release: number): void {
    this.params.release = Math.max(0.01, Math.min(3, release))
    this.compressor.release.value = this.params.release
  }

  /**
   * Set knee (0-40 dB)
   */
  setKnee(knee: number): void {
    this.params.knee = Math.max(0, Math.min(40, knee))
    this.compressor.knee.value = this.params.knee
  }

  /**
   * Get current parameters
   */
  getParams(): CompressorParams {
    return { ...this.params }
  }

  /**
   * Set all parameters at once
   */
  setParams(params: Partial<CompressorParams>): void {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled)
    }
    if (params.threshold !== undefined) {
      this.setThreshold(params.threshold)
    }
    if (params.ratio !== undefined) {
      this.setRatio(params.ratio)
    }
    if (params.attack !== undefined) {
      this.setAttack(params.attack)
    }
    if (params.release !== undefined) {
      this.setRelease(params.release)
    }
    if (params.knee !== undefined) {
      this.setKnee(params.knee)
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.compressor.dispose()
    this.input.dispose()
    this.output.dispose()
  }
}
