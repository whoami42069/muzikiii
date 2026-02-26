# Muzikiii - Claude Code Context

## Project Type
Electron + React + TypeScript desktop DAW-lite application with YouTube audio import.

## Key Commands
```bash
npm run dev          # Start development mode
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check
npm run preview      # Preview production build
```

## Architecture

### Process Model
```
┌─────────────────┐     IPC      ┌─────────────────┐
│  Main Process   │◄────────────►│ Renderer Process│
│  (Node.js)      │              │ (React + Tone.js)│
│  - yt-dlp       │              │ - UI Components  │
│  - File I/O     │              │ - Audio Engine   │
│  - IPC Handlers │              │ - State (Zustand)│
└─────────────────┘              └─────────────────┘
         ▲
         │ contextBridge
         ▼
┌─────────────────┐
│ Preload Script  │
│ - Secure API    │
└─────────────────┘
```

### Directory Structure
- `src/main/` - Electron main process (IPC, yt-dlp, file operations)
- `src/preload/` - Context bridge for secure IPC
- `src/renderer/` - React application
  - `components/` - UI components by feature
  - `audio/` - Tone.js engine and effects
  - `store/` - Zustand state stores
  - `types/` - TypeScript interfaces

## Conventions

### Naming
- Components: PascalCase, `.tsx` extension (e.g., `EffectsRack.tsx`)
- Hooks: `use` prefix, camelCase (e.g., `useAudioEngine.ts`)
- Stores: `{name}Store.ts` pattern (e.g., `tracksStore.ts`)
- Types: Separate files in `types/` directory
- IPC channels: `category:action` format (e.g., `youtube:download`)

### Code Style
- Functional components with hooks
- TypeScript strict mode enabled
- Zustand for global state
- Tailwind for styling

## Audio Stack

| Library | Purpose |
|---------|---------|
| Tone.js | Audio engine, effects, transport |
| wavesurfer.js | Timeline waveform visualization |
| audioMotion-analyzer | Spectrum analyzer visualization |

## IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `youtube:download` | Renderer → Main | Start YouTube audio download |
| `youtube:progress` | Main → Renderer | Download progress updates |
| `youtube:complete` | Main → Renderer | Download completed |
| `youtube:error` | Main → Renderer | Download error |
| `file:save-project` | Renderer → Main | Save project to disk |
| `file:load-project` | Renderer → Main | Load project from disk |
| `file:export-audio` | Renderer → Main | Export audio file |

## Audio Effects (Tone.js Classes)

| Effect | Class | Key Parameters |
|--------|-------|----------------|
| Reverb | `Tone.Reverb` | decay, preDelay, wet |
| Delay | `Tone.FeedbackDelay` | delayTime, feedback, wet |
| EQ | `Tone.EQ3` | low, mid, high (dB) |
| Distortion | `Tone.Distortion` | distortion, oversample, wet |
| Chorus | `Tone.Chorus` | frequency, delayTime, depth |
| Compressor | `Tone.Compressor` | threshold, ratio, attack, release |

## Important Notes

- Call `Tone.start()` on first user interaction (AudioContext restriction)
- yt-dlp binaries auto-download to `app.getPath('userData')`
- Use Tone.js transport as single source of truth for timing
- wavesurfer.js is for visualization only, not playback

## Dependencies

**Core:**
- electron, electron-vite, react, typescript
- tone, wavesurfer.js, audiomotion-analyzer
- zustand, framer-motion, tailwindcss
- ytdlp-nodejs (optional, for YouTube)
