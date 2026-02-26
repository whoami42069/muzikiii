import * as Tone from 'tone'
import { gainToDb } from 'tone'
import { getEffectInstances } from '../store/effectsStore'

export type EngineState = 'stopped' | 'playing' | 'paused'

export interface TrackPlayer {
  id: string
  player: Tone.Player
  channel: Tone.Channel
  meter: Tone.Meter
  loaded: boolean
  duration: number
}

export interface EngineEvents {
  stateChange: (state: EngineState) => void
  timeUpdate: (time: number) => void
  trackLoaded: (trackId: string, duration: number) => void
  trackError: (trackId: string, error: string) => void
}

/**
 * Core audio engine using Tone.js
 * Manages playback, transport, and track routing
 */
class AudioEngine {
  private players: Map<string, TrackPlayer> = new Map()
  private masterChannel: Tone.Channel
  private effectsChain: Tone.Gain
  private analyser: Tone.Analyser
  private meter: Tone.Meter
  private state: EngineState = 'stopped'
  private currentTime: number = 0
  private duration: number = 0
  private timeUpdateInterval: number | null = null
  private initialized: boolean = false
  private effectsConnected: boolean = false

  // Event listeners
  private listeners: Partial<Record<keyof EngineEvents, Set<EngineEvents[keyof EngineEvents]>>> = {}

  constructor() {
    // Create effects chain input
    this.effectsChain = new Tone.Gain(1)

    // Create master channel with volume control
    this.masterChannel = new Tone.Channel({
      volume: 0, // 0 dB
      pan: 0
    })

    // Connect effects chain to master, then master to destination
    this.effectsChain.connect(this.masterChannel)
    this.masterChannel.toDestination()

    // Create analyser for visualizations
    this.analyser = new Tone.Analyser('fft', 256)
    this.masterChannel.connect(this.analyser)

    // Create meter for level monitoring
    this.meter = new Tone.Meter()
    this.masterChannel.connect(this.meter)

    console.log('[AudioEngine] Created')
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true

    try {
      await Tone.start()
      this.initialized = true
      this.connectEffects()
      console.log('[AudioEngine] Audio context started')
      return true
    } catch (error) {
      console.error('[AudioEngine] Failed to start audio context:', error)
      return false
    }
  }

  /**
   * Connect effects chain to the master output
   * Effects are connected in series: reverb -> delay -> eq -> distortion -> chorus -> compressor
   */
  private connectEffects(): void {
    if (this.effectsConnected) return

    try {
      const effects = getEffectInstances()

      // Build effects chain in series
      // effectsChain -> reverb -> delay -> eq -> distortion -> chorus -> compressor -> masterChannel
      let current = this.effectsChain

      current.connect(effects.reverb.getInput())
      current = effects.reverb.getOutput()

      current.connect(effects.delay.getInput())
      current = effects.delay.getOutput()

      current.connect(effects.eq.getInput())
      current = effects.eq.getOutput()

      current.connect(effects.distortion.getInput())
      current = effects.distortion.getOutput()

      current.connect(effects.chorus.getInput())
      current = effects.chorus.getOutput()

      current.connect(effects.compressor.getInput())
      current = effects.compressor.getOutput()

      // Disconnect direct connection and use effects chain
      this.effectsChain.disconnect()
      current.connect(this.masterChannel)

      this.effectsConnected = true
      console.log('[AudioEngine] Effects chain connected')
    } catch (error) {
      console.error('[AudioEngine] Failed to connect effects:', error)
    }
  }

  /**
   * Check if audio context is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return this.state
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime(): number {
    return this.currentTime
  }

  /**
   * Get total duration (longest track)
   */
  getDuration(): number {
    return this.duration
  }

  /**
   * Load a track from file path or URL
   */
  async loadTrack(trackId: string, filePath: string): Promise<void> {
    // Remove existing player if any
    this.unloadTrack(trackId)

    try {
      // Create player and channel
      const player = new Tone.Player({
        url: filePath,
        onload: () => {
          const duration = player.buffer.duration
          const trackPlayer = this.players.get(trackId)
          if (trackPlayer) {
            trackPlayer.loaded = true
            trackPlayer.duration = duration
          }

          // Update total duration
          this.updateDuration()

          this.emit('trackLoaded', trackId, duration)
          console.log(`[AudioEngine] Track loaded: ${trackId}, duration: ${duration.toFixed(2)}s`)
        },
        onerror: (error) => {
          console.error(`[AudioEngine] Track load error: ${trackId}`, error)
          this.emit('trackError', trackId, String(error))
        }
      })

      const channel = new Tone.Channel({
        volume: 0,
        pan: 0,
        mute: false,
        solo: false
      })

      // Create meter for this track
      const meter = new Tone.Meter()

      // Connect: player -> channel -> effects chain
      //                  -> meter (for level monitoring)
      player.connect(channel)
      channel.connect(this.effectsChain)
      channel.connect(meter)

      // Store player reference
      this.players.set(trackId, {
        id: trackId,
        player,
        channel,
        meter,
        loaded: false,
        duration: 0
      })
    } catch (error) {
      console.error(`[AudioEngine] Failed to load track: ${trackId}`, error)
      this.emit('trackError', trackId, String(error))
    }
  }

  /**
   * Unload a track
   */
  unloadTrack(trackId: string): void {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      trackPlayer.player.stop()
      trackPlayer.player.dispose()
      trackPlayer.channel.dispose()
      trackPlayer.meter.dispose()
      this.players.delete(trackId)
      this.updateDuration()
      console.log(`[AudioEngine] Track unloaded: ${trackId}`)
    }
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.initialized) {
      console.warn('[AudioEngine] Not initialized. Call initialize() first.')
      return
    }

    if (this.state === 'playing') return

    // Start all loaded players
    const now = Tone.now()
    this.players.forEach((trackPlayer) => {
      if (trackPlayer.loaded) {
        trackPlayer.player.start(now, this.currentTime)
      }
    })

    this.state = 'playing'
    this.startTimeUpdate()
    this.emit('stateChange', 'playing')
    console.log('[AudioEngine] Playing')
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.state !== 'playing') return

    // Stop all players and remember position
    this.players.forEach((trackPlayer) => {
      if (trackPlayer.loaded) {
        trackPlayer.player.stop()
      }
    })

    this.state = 'paused'
    this.stopTimeUpdate()
    this.emit('stateChange', 'paused')
    console.log('[AudioEngine] Paused')
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    // Stop all players
    this.players.forEach((trackPlayer) => {
      if (trackPlayer.loaded) {
        trackPlayer.player.stop()
      }
    })

    this.state = 'stopped'
    this.currentTime = 0
    this.stopTimeUpdate()
    this.emit('stateChange', 'stopped')
    this.emit('timeUpdate', 0)
    console.log('[AudioEngine] Stopped')
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.duration))
    this.currentTime = clampedTime

    if (this.state === 'playing') {
      // Restart from new position
      const now = Tone.now()
      this.players.forEach((trackPlayer) => {
        if (trackPlayer.loaded) {
          trackPlayer.player.stop()
          trackPlayer.player.start(now, clampedTime)
        }
      })
    }

    this.emit('timeUpdate', clampedTime)
  }

  /**
   * Set track volume (linear 0-1, converted to dB internally)
   */
  setTrackVolume(trackId: string, volume: number): void {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      // Convert linear gain (0-1) to dB
      // Clamp to avoid -Infinity at 0
      const clampedVolume = Math.max(0.0001, Math.min(1, volume))
      trackPlayer.channel.volume.value = gainToDb(clampedVolume)
    }
  }

  /**
   * Set track pan (-1 to 1)
   */
  setTrackPan(trackId: string, pan: number): void {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      trackPlayer.channel.pan.value = pan
    }
  }

  /**
   * Set track mute state
   */
  setTrackMute(trackId: string, muted: boolean): void {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      trackPlayer.channel.mute = muted
    }
  }

  /**
   * Set track solo state
   */
  setTrackSolo(trackId: string, solo: boolean): void {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      trackPlayer.channel.solo = solo
    }
  }

  /**
   * Set master volume (linear 0-1, converted to dB internally)
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0.0001, Math.min(1, volume))
    this.masterChannel.volume.value = gainToDb(clampedVolume)
  }

  /**
   * Get analyser node for visualizations
   */
  getAnalyser(): Tone.Analyser {
    return this.analyser
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Float32Array {
    return this.analyser.getValue() as Float32Array
  }

  /**
   * Get current master level in dB
   */
  getLevel(): number {
    return this.meter.getValue() as number
  }

  /**
   * Get track level in dB
   */
  getTrackLevel(trackId: string): number {
    const trackPlayer = this.players.get(trackId)
    if (trackPlayer) {
      return trackPlayer.meter.getValue() as number
    }
    return -Infinity
  }

  /**
   * Get all track IDs
   */
  getTrackIds(): string[] {
    return Array.from(this.players.keys())
  }

  /**
   * Get master channel for connecting effects
   */
  getMasterChannel(): Tone.Channel {
    return this.masterChannel
  }

  /**
   * Check if a track is loaded
   */
  isTrackLoaded(trackId: string): boolean {
    const trackPlayer = this.players.get(trackId)
    return trackPlayer?.loaded ?? false
  }

  /**
   * Get track duration
   */
  getTrackDuration(trackId: string): number {
    const trackPlayer = this.players.get(trackId)
    return trackPlayer?.duration ?? 0
  }

  /**
   * Add event listener
   */
  on<K extends keyof EngineEvents>(event: K, callback: EngineEvents[K]): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set()
    }
    this.listeners[event]!.add(callback as EngineEvents[keyof EngineEvents])
  }

  /**
   * Remove event listener
   */
  off<K extends keyof EngineEvents>(event: K, callback: EngineEvents[K]): void {
    this.listeners[event]?.delete(callback as EngineEvents[keyof EngineEvents])
  }

  /**
   * Emit event
   */
  private emit<K extends keyof EngineEvents>(event: K, ...args: Parameters<EngineEvents[K]>): void {
    this.listeners[event]?.forEach((callback) => {
      ;(callback as (...args: Parameters<EngineEvents[K]>) => void)(...args)
    })
  }

  /**
   * Update total duration based on loaded tracks
   */
  private updateDuration(): void {
    let maxDuration = 0
    this.players.forEach((trackPlayer) => {
      if (trackPlayer.loaded && trackPlayer.duration > maxDuration) {
        maxDuration = trackPlayer.duration
      }
    })
    this.duration = maxDuration
  }

  /**
   * Start time update interval
   */
  private startTimeUpdate(): void {
    if (this.timeUpdateInterval) return

    const startTime = Tone.now()
    const startPosition = this.currentTime

    this.timeUpdateInterval = window.setInterval(() => {
      if (this.state === 'playing') {
        this.currentTime = startPosition + (Tone.now() - startTime)

        // Check if we've reached the end
        if (this.currentTime >= this.duration) {
          this.stop()
          return
        }

        this.emit('timeUpdate', this.currentTime)
      }
    }, 50) // Update every 50ms
  }

  /**
   * Stop time update interval
   */
  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval) {
      window.clearInterval(this.timeUpdateInterval)
      this.timeUpdateInterval = null
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stop()

    // Dispose all players
    this.players.forEach((trackPlayer) => {
      trackPlayer.player.dispose()
      trackPlayer.channel.dispose()
      trackPlayer.meter.dispose()
    })
    this.players.clear()

    // Dispose effects chain
    if (this.effectsConnected) {
      const effects = getEffectInstances()
      effects.reverb.dispose()
      effects.delay.dispose()
      effects.eq.dispose()
      effects.distortion.dispose()
      effects.chorus.dispose()
      effects.compressor.dispose()
    }

    // Dispose master chain
    this.effectsChain.dispose()
    this.analyser.dispose()
    this.meter.dispose()
    this.masterChannel.dispose()

    this.listeners = {}
    console.log('[AudioEngine] Disposed')
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
