// Audio-related type definitions

export type EffectType =
  | 'reverb'
  | 'delay'
  | 'eq'
  | 'distortion'
  | 'chorus'
  | 'compressor';

export interface EffectParams {
  enabled: boolean;
  wet: number; // 0-1
}

export interface ReverbParams extends EffectParams {
  decay: number;      // 1-10 seconds
  preDelay: number;   // 0-0.1 seconds
}

export interface DelayParams extends EffectParams {
  delayTime: number;  // 0-1 seconds
  feedback: number;   // 0-0.9
}

export interface EQParams extends EffectParams {
  low: number;        // -12 to +12 dB
  mid: number;        // -12 to +12 dB
  high: number;       // -12 to +12 dB
  lowFrequency: number;   // 200-400 Hz
  highFrequency: number;  // 2000-5000 Hz
}

export interface DistortionParams extends EffectParams {
  distortion: number;     // 0-1
  oversample: 'none' | '2x' | '4x';
}

export interface ChorusParams extends EffectParams {
  frequency: number;      // 0.1-10 Hz
  delayTime: number;      // 2-20 ms
  depth: number;          // 0-1
}

export interface CompressorParams extends EffectParams {
  threshold: number;      // -60 to 0 dB
  ratio: number;          // 1-20
  attack: number;         // 0-1 seconds
  release: number;        // 0-1 seconds
  knee: number;           // 0-40 dB
}

export type AllEffectParams = {
  reverb: ReverbParams;
  delay: DelayParams;
  eq: EQParams;
  distortion: DistortionParams;
  chorus: ChorusParams;
  compressor: CompressorParams;
};

export interface AudioAnalysis {
  bass: number;       // 0-1 level
  mid: number;        // 0-1 level
  treble: number;     // 0-1 level
  rms: number;        // Overall RMS level
  peak: number;       // Peak level
  waveform: Float32Array;
  frequencies: Float32Array;
}
