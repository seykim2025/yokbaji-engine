# Yokbaji Reaction Engine - Infrastructure Architecture

## Overview

The Yokbaji Reaction Engine is an Express.js backend service that generates personality-driven reaction GIFs/videos by face-swapping a user-uploaded photo onto pre-recorded "driving" videos using the Replicate AI platform. It powers the "Emotional Trash Can" casual mini-game concept.

**GitHub:** https://github.com/seykim2025/yokbaji-engine
**Production URL:** https://yokbaji-engine.vercel.app
**Frontend URL:** https://default-rosy-seven.vercel.app

---

## System Architecture

```
┌──────────────────────┐       ┌──────────────────────────────┐
│  Main Yokbaji App    │       │  Yokbaji Reaction Engine      │
│  (Frontend - Vite)   │──────▶│  (Express.js on Vercel)       │
│  default-rosy-seven  │       │  yokbaji-engine.vercel.app    │
│  .vercel.app         │       │                               │
└──────────────────────┘       │  ┌─────────────────────────┐  │
                               │  │ API Routes              │  │
                               │  │ /health                 │  │
                               │  │ /api/assets             │  │
                               │  │ /api/characters         │  │
                               │  │ /api/reactions          │  │
                               │  └──────────┬──────────────┘  │
                               │             │                 │
                               │  ┌──────────▼──────────────┐  │
                               │  │ Service Layer           │  │
                               │  │ character.service.ts    │  │
                               │  │ reaction.service.ts     │  │
                               │  └──────────┬──────────────┘  │
                               │             │                 │
                               │  ┌──────────▼──────────────┐  │
                               │  │ Library Layer           │  │
                               │  │ replicate-client.ts     │  │
                               │  │ asset-selector.ts       │  │
                               │  │ cache.ts                │  │
                               │  │ dialogue-generator.ts   │  │
                               │  │ paths.ts                │  │
                               │  └──────────┬──────────────┘  │
                               └─────────────┼─────────────────┘
                                             │
                               ┌─────────────▼─────────────────┐
                               │  Replicate API                 │
                               │  Model: zedge/live-portrait    │
                               │  (Face swap video generation)  │
                               └────────────────────────────────┘
```

---

## 1. Yokbaji Reaction Engine (`yokbaji-engine`)

### Runtime & Deployment

| Property             | Value                                    |
| -------------------- | ---------------------------------------- |
| Runtime              | Node.js (Vercel Serverless Function)     |
| Framework            | Express.js v5                            |
| Language             | TypeScript (ES2022 target, CommonJS)     |
| Bundler              | `tsc` (TypeScript compiler)              |
| Deployment Platform  | Vercel                                   |
| Function Entry Point | `api/index.ts` (re-exports Express app)  |
| Max Function Duration| 300 seconds                              |
| Routing              | All requests rewritten to `/api` via `vercel.json` |

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }],
  "functions": {
    "api/index.ts": {
      "maxDuration": 300,
      "includeFiles": "{assets/**,public/**}"
    }
  }
}
```

- **Single-function architecture:** All routes are handled by one Vercel Function (`api/index.ts`), which imports the Express app from `src/app.ts`.
- **Bundled assets:** The `includeFiles` directive bundles `assets/` (base driving videos) and `public/` (frontend HTML) into the function deployment.

### Module Structure

```
yokbaji-engine/
├── api/
│   └── index.ts              # Vercel Function entry point
├── src/
│   ├── app.ts                # Express app with all route definitions
│   ├── server.ts             # Local dev server (not used on Vercel)
│   ├── types.ts              # TypeScript type definitions
│   ├── data/
│   │   └── base-assets.json  # Asset metadata (12 base videos)
│   ├── lib/
│   │   ├── replicate-client.ts   # Replicate API wrapper (zedge/live-portrait)
│   │   ├── asset-selector.ts     # Base video selection logic
│   │   ├── cache.ts              # File-based cache index (JSON)
│   │   ├── dialogue-generator.ts # Dialogue generation (fallback mode)
│   │   └── paths.ts              # Environment-aware path resolution
│   ├── prompts/
│   │   └── reaction-dialogue.prompts.ts  # LLM prompt templates (Korean)
│   └── services/
│       ├── character.service.ts  # Character CRUD (file-based)
│       └── reaction.service.ts   # Reaction generation orchestration
├── assets/
│   └── base-videos/          # 12 pre-recorded driving videos (.mp4)
├── public/
│   └── index.html            # Frontend SPA
├── storage/                  # Local-only writable storage (gitignored)
├── package.json
├── tsconfig.json
└── vercel.json
```

### API Endpoints

| Method | Path                  | Description                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/health`             | Health check — returns engine version         |
| GET    | `/api/assets`         | List all 12 base video assets with metadata   |
| POST   | `/api/characters`     | Create a character (multipart: image upload)   |
| GET    | `/api/characters`     | List all created characters                    |
| GET    | `/api/characters/:id` | Get a specific character by ID                 |
| POST   | `/api/reactions`      | Generate a reaction video for a character      |
| GET    | `*`                   | SPA fallback — serves `public/index.html`      |

### Core Data Flow: Reaction Generation

1. **User uploads a face image** via `POST /api/characters` (with personality type and gender).
2. **User requests a reaction** via `POST /api/reactions` with `character_id` and `user_message`.
3. **Asset selection** (`asset-selector.ts`): Picks an unused base driving video matching the character's personality and gender. Falls back to gender-neutral (`N`) videos. Tracks used videos to avoid repetition.
4. **Cache check** (`cache.ts`): If a video was already generated for this character + asset combination, reuse it. If all assets are exhausted, randomly reuse a cached result.
5. **Replicate API call** (`replicate-client.ts`): Sends the user's face image and the driving video (both as base64 data URIs) to `zedge/live-portrait` on Replicate. Downloads the resulting face-swapped video.
6. **Dialogue generation** (`dialogue-generator.ts`): Currently uses hardcoded fallback dialogues per personality type. LLM prompt templates are ready but not yet wired to an API.
7. **Response** returned with video URL, dialogue text, and metadata.

### Personality System

Four personality types, each with distinct Korean dialogue styles:

| Type       | Behavior        | Asset Prefix Examples   |
| ---------- | --------------- | ----------------------- |
| `WEAK`     | Timid, anxious  | `N_WEAK_01..03`         |
| `ANGRY`    | Aggressive      | `M_ANGRY_01..03`        |
| `SARCASTIC`| Mocking, snarky | `F_SARCASTIC_01..03`    |
| `STOIC`    | Cold, detached  | `N_STOIC_01..03`        |

Gender variants: `M` (male), `F` (female), `N` (neutral/any).

### Base Video Assets

- **Count:** 12 videos (4 personality types x 3 variations)
- **Format:** MP4
- **Location:** `assets/base-videos/`
- **Naming convention:** `{GENDER}_{PERSONALITY}_{NUMBER}.mp4`
- **Bundled into the Vercel Function** via `includeFiles` in `vercel.json`

---

## 2. Main Yokbaji App (Frontend)

| Property            | Value                              |
| ------------------- | ---------------------------------- |
| Production URL      | https://default-rosy-seven.vercel.app |
| Build Tool          | Vite                               |
| Deployment Platform | Vercel                             |

The frontend is a standalone Vite-based SPA deployed separately on Vercel. It communicates with the Yokbaji Reaction Engine via its API endpoints.

The engine also serves its own minimal frontend at `public/index.html` for direct testing.

---

## 3. External Dependencies

### Replicate API

| Property      | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Model         | `zedge/live-portrait`                                                  |
| Version       | `9f8f5880eb2db3778cc689fa00ee6e090fa3d8388ac278b608d4cc526a44c5df`     |
| Purpose       | Face-swap: applies a user's face onto a pre-recorded driving video     |
| Input format  | Base64 data URIs (source image + driving video)                        |
| Output        | URL to the generated video                                             |

### NPM Dependencies

| Package    | Version  | Purpose                            |
| ---------- | -------- | ---------------------------------- |
| express    | ^5.2.1   | HTTP server framework              |
| multer     | ^2.1.1   | Multipart file upload handling     |
| replicate  | ^1.0.1   | Replicate API client               |
| sharp      | ^0.34.5  | Image processing (available but not yet used in core flow) |

---

## 4. Environment & Secrets

| Variable                       | Required | Description                                  |
| ------------------------------ | -------- | -------------------------------------------- |
| `REPLICATE_API_TOKEN`          | Yes      | Replicate API authentication token            |
| `YOKBAJI_REPLICATE_API_TOKEN`  | No       | Alternative env var name (checked first)      |
| `VERCEL`                       | Auto     | Set automatically by Vercel runtime           |

- Secrets are managed via **Vercel Environment Variables** (not committed to git).
- `.env` and `.env.*` files are gitignored.

---

## 5. Storage Architecture

### Local Development

- **Writable storage:** `./storage/` (gitignored)
  - `storage/uploads/` — Uploaded user images (via multer)
  - `storage/characters/{id}/meta.json` — Character metadata
  - `storage/characters/{id}/source.jpg` — Copied user face images
  - `storage/generated/{id}/{code}.mp4` — Generated reaction videos
  - `storage/cache-index.json` — Cache index mapping character+asset to video paths

### Vercel Production

- **Writable storage:** `/tmp/yokbaji-storage/` (ephemeral)
  - Same directory structure as local, but under `/tmp`
  - **Ephemeral:** Data is lost between function invocations and cold starts
  - **No persistent storage is configured** — this is a known limitation for production

### Storage Limitation (Production)

> **Critical:** On Vercel, `/tmp` is ephemeral. Generated videos, character data, and cache are lost between cold starts. A persistent storage solution (e.g., Vercel Blob, S3, or a database) is needed before production launch.

---

## 6. Caching Strategy

The engine implements a **file-based cache** (`src/lib/cache.ts`):

- **Cache index:** JSON file at `{storageDir}/cache-index.json`
- **Key format:** `{character_id}:{base_asset_code}`
- **Cache hit:** Returns previously generated video path (skips Replicate API call)
- **Cache miss:** Calls Replicate, downloads video, stores in generated directory, updates cache
- **Exhaustion handling:** When all base assets for a personality+gender are used, randomly reuses a cached result
- **File existence check:** Cache entries are invalidated if the video file no longer exists

> **Note:** Cache is only effective within a single Vercel function instance lifetime due to ephemeral `/tmp` storage.

---

## 7. Dialogue System

- **Current state:** Fallback mode — returns random pre-written Korean dialogues per personality type
- **Future state:** LLM prompt templates are fully defined in `src/prompts/reaction-dialogue.prompts.ts` and ready to be wired to an LLM API (e.g., Claude, OpenAI)
- **Prompt design:** System prompt enforces short, direct, in-character Korean responses. Each personality type has specific behavioral rules and example lines.

---

## 8. Known Limitations & Production Readiness

| Issue                          | Severity | Notes                                            |
| ------------------------------ | -------- | ------------------------------------------------ |
| Ephemeral `/tmp` storage       | Critical | No persistent storage for characters or videos   |
| No database                    | High     | Character data is file-based, lost on cold start |
| No authentication              | High     | API endpoints are publicly accessible             |
| No rate limiting               | Medium   | Replicate API calls are expensive                 |
| Dialogue is static fallback    | Medium   | LLM integration not yet wired                    |
| `sharp` imported but unused    | Low      | Listed as dependency, not used in core flow       |
| Single-region deployment       | Low      | Default Vercel region only                        |
