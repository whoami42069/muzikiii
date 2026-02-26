import * as Tone from 'tone';
import type { DelayParams } from '../../types';

/**
 * Delay effect wrapper
 * Uses Tone.FeedbackDelay for echo/delay effects
 */
export class DelayEffect {
  private delay: Tone.FeedbackDelay;
  private wetGain: Tone.Gain;
  private dryGain: Tone.Gain;
  private input: Tone.Gain;
  private output: Tone.Gain;
  private params: DelayParams;

  constructor() {
    // Create delay instance
    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.4,
    });

    // Create wet/dry mix
    this.wetGain = new Tone.Gain(0.3);
    this.dryGain = new Tone.Gain(0.7);
    this.input = new Tone.Gain(1);
    this.output = new Tone.Gain(1);

    // Connect signal chain: input -> [dry + (delay -> wet)] -> output
    this.input.connect(this.dryGain);
    this.input.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    // Initialize params
    this.params = {
      enabled: false,
      delayTime: 0.25,
      feedback: 0.4,
      wet: 0.3,
    };
  }

  /**
   * Get input node for connection
   */
  getInput(): Tone.Gain {
    return this.input;
  }

  /**
   * Get output node for connection
   */
  getOutput(): Tone.Gain {
    return this.output;
  }

  /**
   * Enable or disable the effect
   */
  setEnabled(enabled: boolean): void {
    this.params.enabled = enabled;
    if (enabled) {
      this.wetGain.gain.value = this.params.wet;
      this.dryGain.gain.value = 1 - this.params.wet;
    } else {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
    }
  }

  /**
   * Set delay time (0-5 seconds)
   * Extended range for tempo-synced delays at slower BPMs
   */
  setDelayTime(delayTime: number): void {
    this.params.delayTime = Math.max(0, Math.min(5, delayTime));
    this.delay.delayTime.value = this.params.delayTime;
  }

  /**
   * Set feedback amount (0-0.9)
   */
  setFeedback(feedback: number): void {
    this.params.feedback = Math.max(0, Math.min(0.9, feedback));
    this.delay.feedback.value = this.params.feedback;
  }

  /**
   * Set wet/dry mix (0-1)
   */
  setWet(wet: number): void {
    this.params.wet = Math.max(0, Math.min(1, wet));
    if (this.params.enabled) {
      this.wetGain.gain.value = this.params.wet;
      this.dryGain.gain.value = 1 - this.params.wet;
    }
  }

  /**
   * Get current parameters
   */
  getParams(): DelayParams {
    return { ...this.params };
  }

  /**
   * Set all parameters at once
   */
  setParams(params: Partial<DelayParams>): void {
    if (params.enabled !== undefined) {
      this.setEnabled(params.enabled);
    }
    if (params.delayTime !== undefined) {
      this.setDelayTime(params.delayTime);
    }
    if (params.feedback !== undefined) {
      this.setFeedback(params.feedback);
    }
    if (params.wet !== undefined) {
      this.setWet(params.wet);
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.delay.dispose();
    this.wetGain.dispose();
    this.dryGain.dispose();
    this.input.dispose();
    this.output.dispose();
  }
}
