import { create } from 'zustand';
import type {
  EffectType,
  AllEffectParams,
  ReverbParams,
  DelayParams,
  EQParams,
  DistortionParams,
  ChorusParams,
  CompressorParams,
} from '../types';
import {
  ReverbEffect,
  DelayEffect,
  EQEffect,
  DistortionEffect,
  ChorusEffect,
  CompressorEffect,
} from '../audio/effects';

/**
 * Effects instances (singleton)
 */
const effectInstances = {
  reverb: new ReverbEffect(),
  delay: new DelayEffect(),
  eq: new EQEffect(),
  distortion: new DistortionEffect(),
  chorus: new ChorusEffect(),
  compressor: new CompressorEffect(),
};

/**
 * Default effect parameters
 */
const DEFAULT_PARAMS: AllEffectParams = {
  reverb: {
    enabled: false,
    decay: 2.5,
    preDelay: 0.01,
    wet: 0.3,
  },
  delay: {
    enabled: false,
    delayTime: 0.25,
    feedback: 0.4,
    wet: 0.3,
  },
  eq: {
    enabled: false,
    low: 0,
    mid: 0,
    high: 0,
    lowFrequency: 300,
    highFrequency: 3000,
    wet: 1,
  },
  distortion: {
    enabled: false,
    distortion: 0.4,
    oversample: 'none',
    wet: 0.5,
  },
  chorus: {
    enabled: false,
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    wet: 0.5,
  },
  compressor: {
    enabled: false,
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    knee: 10,
    wet: 1,
  },
};

interface EffectsState {
  params: AllEffectParams;
  initialized: boolean;
}

interface EffectsActions {
  // Effect enable/disable
  toggleEffect: (type: EffectType) => void;
  setEffectEnabled: (type: EffectType, enabled: boolean) => void;

  // Parameter updates
  updateReverbParam: <K extends keyof ReverbParams>(param: K, value: ReverbParams[K]) => void;
  updateDelayParam: <K extends keyof DelayParams>(param: K, value: DelayParams[K]) => void;
  updateEQParam: <K extends keyof EQParams>(param: K, value: EQParams[K]) => void;
  updateDistortionParam: <K extends keyof DistortionParams>(
    param: K,
    value: DistortionParams[K]
  ) => void;
  updateChorusParam: <K extends keyof ChorusParams>(param: K, value: ChorusParams[K]) => void;
  updateCompressorParam: <K extends keyof CompressorParams>(
    param: K,
    value: CompressorParams[K]
  ) => void;

  // Bulk updates
  setEffectParams: <T extends EffectType>(type: T, params: Partial<AllEffectParams[T]>) => void;

  // Effect chain access
  getEffectInstances: () => typeof effectInstances;

  // Reset
  resetEffect: (type: EffectType) => void;
  resetAllEffects: () => void;
}

/**
 * Effects store
 * Manages effect parameters and syncs with Tone.js effect instances
 */
export const useEffectsStore = create<EffectsState & EffectsActions>((set, get) => ({
  params: DEFAULT_PARAMS,
  initialized: false,

  // Toggle effect on/off
  toggleEffect: (type) => {
    const currentEnabled = get().params[type].enabled;
    get().setEffectEnabled(type, !currentEnabled);
  },

  // Set effect enabled state
  setEffectEnabled: (type, enabled) => {
    set((state) => ({
      params: {
        ...state.params,
        [type]: {
          ...state.params[type],
          enabled,
        },
      },
    }));

    // Update Tone.js instance
    effectInstances[type].setEnabled(enabled);
  },

  // Update reverb parameter
  updateReverbParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        reverb: {
          ...state.params.reverb,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.reverb;
    if (param === 'decay') {
      effect.setDecay(value as number);
    } else if (param === 'preDelay') {
      effect.setPreDelay(value as number);
    } else if (param === 'wet') {
      effect.setWet(value as number);
    }
  },

  // Update delay parameter
  updateDelayParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        delay: {
          ...state.params.delay,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.delay;
    if (param === 'delayTime') {
      effect.setDelayTime(value as number);
    } else if (param === 'feedback') {
      effect.setFeedback(value as number);
    } else if (param === 'wet') {
      effect.setWet(value as number);
    }
  },

  // Update EQ parameter
  updateEQParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        eq: {
          ...state.params.eq,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.eq;
    if (param === 'low') {
      effect.setLow(value as number);
    } else if (param === 'mid') {
      effect.setMid(value as number);
    } else if (param === 'high') {
      effect.setHigh(value as number);
    } else if (param === 'lowFrequency') {
      effect.setLowFrequency(value as number);
    } else if (param === 'highFrequency') {
      effect.setHighFrequency(value as number);
    }
  },

  // Update distortion parameter
  updateDistortionParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        distortion: {
          ...state.params.distortion,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.distortion;
    if (param === 'distortion') {
      effect.setDistortion(value as number);
    } else if (param === 'oversample') {
      effect.setOversample(value as 'none' | '2x' | '4x');
    } else if (param === 'wet') {
      effect.setWet(value as number);
    }
  },

  // Update chorus parameter
  updateChorusParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        chorus: {
          ...state.params.chorus,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.chorus;
    if (param === 'frequency') {
      effect.setFrequency(value as number);
    } else if (param === 'delayTime') {
      effect.setDelayTime(value as number);
    } else if (param === 'depth') {
      effect.setDepth(value as number);
    } else if (param === 'wet') {
      effect.setWet(value as number);
    }
  },

  // Update compressor parameter
  updateCompressorParam: (param, value) => {
    set((state) => ({
      params: {
        ...state.params,
        compressor: {
          ...state.params.compressor,
          [param]: value,
        },
      },
    }));

    // Update Tone.js instance
    const effect = effectInstances.compressor;
    if (param === 'threshold') {
      effect.setThreshold(value as number);
    } else if (param === 'ratio') {
      effect.setRatio(value as number);
    } else if (param === 'attack') {
      effect.setAttack(value as number);
    } else if (param === 'release') {
      effect.setRelease(value as number);
    } else if (param === 'knee') {
      effect.setKnee(value as number);
    }
  },

  // Set multiple parameters at once
  setEffectParams: (type, params) => {
    set((state) => ({
      params: {
        ...state.params,
        [type]: {
          ...state.params[type],
          ...params,
        },
      },
    }));

    // Update Tone.js instance
    effectInstances[type].setParams(params);
  },

  // Get effect instances for audio routing
  getEffectInstances: () => effectInstances,

  // Reset a single effect
  resetEffect: (type) => {
    const defaultParams = DEFAULT_PARAMS[type];
    set((state) => ({
      params: {
        ...state.params,
        [type]: defaultParams,
      },
    }));

    // Update Tone.js instance
    effectInstances[type].setParams(defaultParams);
  },

  // Reset all effects
  resetAllEffects: () => {
    set({ params: DEFAULT_PARAMS });

    // Update all Tone.js instances
    Object.keys(effectInstances).forEach((type) => {
      const effectType = type as EffectType;
      effectInstances[effectType].setParams(DEFAULT_PARAMS[effectType]);
    });
  },
}));

/**
 * Get effect instances for audio routing
 */
export function getEffectInstances() {
  return effectInstances;
}
