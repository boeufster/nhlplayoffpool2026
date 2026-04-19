# Design Document: Shared Data — Vercel Postgres Migration

## Overview

This feature migrates the NHL Playoff Pool application from localStorage-based per-user data persistence to a shared Vercel Postgres database (powered by Neon) with serverless API routes. The database becomes the single source of truth for all users. Admin changes are instant — the admin makes updates in the UI, the API writes to Postgres, and all users see the updates on their next page load or refresh.

The middle tab (currently PlayerSelectorView for player submission) becomes a read-only "Teams" view showing all entries and their player picks. Player submission and entry creation functionality moves entirely into the AdminView. localStorage is retained only for admin authentication state.

The API layer consists of Vercel serverless functions in the `api/` directory that perform CRUD operations against Postgres. The frontend Vue.js stores are updated to fetch data from these API routes instead of localStorage.

## Architecture

```mermaid
graph TD
    subgraph "Browser (All Users)"
        A[Vue.js 3 SPA] --> B[Pinia Stores]
        B --> C[apiService.js]
    end

    subgraph "Vercel Platform"
        C -->|HTTP requests| D[Serverless API Routes]
        D --> E[(Vercel Postgres / Neon)]
        F[Static Assets - dist/]
    end

    subgraph "Local Development"
        G[Local Postgres] -->|POSTGRES_URL in .env.local| D
    end

    A --> F
```

### Data Flow: Read Path (All Users)

```mermaid
sequenceDiagram
    participant User as Browser
    participant App as Vue App
    participant API as apiService.js
    participant Server as Vercel Serverless
    participant DB as Postgres (Neon)

    User->>App: Load application
    App->>API: fetchPoolData()
    API->>Server: GET /api/pool-data
    Server->>DB: SELECT participants, entries, scores
    DB-->>Server: Result rows
    Server-->>API: JSON response
    API->>App: Hydrate Pinia stores
    App->>User: Render standings, teams, admin
```

### Data Flow: Write Path (Admin Only)

```mermaid
sequenceDiagram
    participant Admin as Admin (Browser)
    participant App as Vue App
    participant API as apiService.js
    participant Server as Vercel Serverless
    participant DB as Postgres (Neon)
    participant Users as Other Users

    Admin->>App: Add participant / Create entry / Update scores
    App->>API: POST /api/participants (or entries, scores)
    API->>Server: Serverless function invoked
    Server->>DB: INSERT / UPDATE
    DB-->>Server: Confirmation
    Server-->>API: JSON response (created/updated record)
    API->>App: Update local Pinia store
    App->>Admin: UI reflects change instantly
    Users->>Server: GET /api/pool-data (on next load/refresh)
    Server->>DB: SELECT all
    DB-->>Users: Fresh data
```

## Database Schema

All tables live in Vercel Postgres (Neon-powered). Connection is via `POSTGRES_URL` environment variable — set in Vercel dashboard for production, in `.env.local` for local development.

### CREATE TABLE Statements

```sql
-- Participants in the pool
CREATE TABLE IF NOT EXISTS participants (
  email       VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  entry_fee   NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each participant can have multiple entries
CREATE TABLE IF NOT EXISTS entries (
  id                VARCHAR(100) PRIMARY KEY,
  email             VARCHAR(255) NOT NULL REFERENCES participants(email) ON DELETE CASCADE,
  participant_name  VARCHAR(255) NOT NULL,
  total_score       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at      TIMESTAMPTZ
);

-- Players assigned to an entry (exactly 15 per entry)
CREATE TABLE IF NOT EXISTS entry_players (
  id          SERIAL PRIMARY KEY,
  entry_id    VARCHAR(100) NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  position    SMALLINT NOT NULL, -- 1-based ordering position
  UNIQUE(entry_id, player_name),
  UNIQUE(entry_id, position)
);

-- Scoring events (player stats snapshots pasted by admin)
CREATE TABLE IF NOT EXISTS scoring_events (
  id              VARCHAR(100) PRIMARY KEY,
  player_name     VARCHAR(255) NOT NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log of admin scoring update operations
CREATE TABLE IF NOT EXISTS scoring_update_logs (
  id                VARCHAR(100) PRIMARY KEY,
  player_name       VARCHAR(255) NOT NULL,
  points            INTEGER NOT NULL DEFAULT 0,
  entries_affected  INTEGER NOT NULL DEFAULT 0,
  success           BOOLEAN NOT NULL DEFAULT TRUE,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration Script

```sql
-- migrate.sql — Run once to set up the database
-- For local dev: psql $POSTGRES_URL -f migrate.sql
-- For production: run via Vercel Postgres console or psql

BEGIN;

CREATE TABLE IF NOT EXISTS participants (
  email       VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  entry_fee   NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id                VARCHAR(100) PRIMARY KEY,
  email             VARCHAR(255) NOT NULL REFERENCES participants(email) ON DELETE CASCADE,
  participant_name  VARCHAR(255) NOT NULL,
  total_score       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS entry_players (
  id          SERIAL PRIMARY KEY,
  entry_id    VARCHAR(100) NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  position    SMALLINT NOT NULL,
  UNIQUE(entry_id, player_name),
  UNIQUE(entry_id, position)
);

CREATE TABLE IF NOT EXISTS scoring_events (
  id              VARCHAR(100) PRIMARY KEY,
  player_name     VARCHAR(255) NOT NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scoring_update_logs (
  id                VARCHAR(100) PRIMARY KEY,
  player_name       VARCHAR(255) NOT NULL,
  points            INTEGER NOT NULL DEFAULT 0,
  entries_affected  INTEGER NOT NULL DEFAULT 0,
  success           BOOLEAN NOT NULL DEFAULT TRUE,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
```

### Entity Relationship Diagram

```mermaid
erDiagram
    participants ||--o{ entries : "has many"
    entries ||--o{ entry_players : "has up to 15"
    scoring_events ||--o{ scoring_update_logs : "generates"

    participants {
        varchar email PK
        varchar name
        numeric entry_fee
        timestamptz created_at
    }

    entries {
        varchar id PK
        varchar email FK
        varchar participant_name
        integer total_score
        timestamptz created_at
        timestamptz submitted_at
    }

    entry_players {
        serial id PK
        varchar entry_id FK
        varchar player_name
        smallint position
    }

    scoring_events {
        varchar id PK
        varchar player_name
        integer points
        timestamptz created_at
    }

    scoring_update_logs {
        varchar id PK
        varchar player_name
        integer points
        integer entries_affected
        boolean success
        text reason
        timestamptz created_at
    }
```

## Components and Interfaces

### Component 1: API Routes (Vercel Serverless Functions)

All API routes live in the `api/` directory. Each is a serverless function that connects to Postgres via `@vercel/postgres`.

#### `api/participants.js`

**Purpose**: CRUD for participants.

```javascript
// GET  /api/participants — returns all participants
// POST /api/participants — create a participant { email, name, entryFee }
// DELETE /api/participants?email=... — remove a participant (cascades to entries)

import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt"
      FROM participants ORDER BY created_at ASC
    `
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const { email, name, entryFee } = req.body
    if (!email || !name) return res.status(400).json({ error: 'email and name required' })
    const fee = entryFee ?? 20
    await sql`
      INSERT INTO participants (email, name, entry_fee)
      VALUES (${email}, ${name}, ${fee})
    `
    return res.status(201).json({ email, name, entryFee: fee })
  }

  if (req.method === 'DELETE') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email query param required' })
    await sql`DELETE FROM participants WHERE email = ${email}`
    return res.json({ deleted: email })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

#### `api/entries.js`

**Purpose**: CRUD for entries, including player names via JOIN.

```javascript
// GET  /api/entries — returns all entries with player names
// POST /api/entries — create an entry { email, participantName }
// DELETE /api/entries?id=... — remove an entry

import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch entries
    const { rows: entries } = await sql`
      SELECT id, email, participant_name AS "participantName",
             total_score AS "totalScore",
             created_at AS "createdAt", submitted_at AS "submittedAt"
      FROM entries ORDER BY created_at ASC
    `
    // Fetch all entry_players in one query
    const { rows: players } = await sql`
      SELECT entry_id AS "entryId", player_name AS "playerName", position
      FROM entry_players ORDER BY position ASC
    `
    // Group players by entry
    const playersByEntry = {}
    for (const p of players) {
      if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
      playersByEntry[p.entryId].push(p.playerName)
    }
    // Attach to entries
    const result = entries.map(e => ({
      ...e,
      playerNames: playersByEntry[e.id] || [],
      playerIds: playersByEntry[e.id] || [] // backward compat
    }))
    return res.json(result)
  }

  if (req.method === 'POST') {
    const { email, participantName } = req.body
    if (!email || !participantName) {
      return res.status(400).json({ error: 'email and participantName required' })
    }
    const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await sql`
      INSERT INTO entries (id, email, participant_name)
      VALUES (${id}, ${email}, ${participantName})
    `
    return res.status(201).json({ id, email, participantName, totalScore: 0, playerNames: [] })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id query param required' })
    await sql`DELETE FROM entries WHERE id = ${id}`
    return res.json({ deleted: id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

#### `api/entries/[id]/players.js`

**Purpose**: Assign players to an entry (PUT replaces all players).

```javascript
// PUT /api/entries/:id/players — assign player names to an entry
// Body: { playerNames: ["Player 1", ..., "Player 15"] }

import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { playerNames } = req.body

  if (!id) return res.status(400).json({ error: 'Entry id required' })
  if (!Array.isArray(playerNames) || playerNames.length !== 15) {
    return res.status(400).json({ error: 'Exactly 15 playerNames required' })
  }

  // Verify entry exists
  const { rows } = await sql`SELECT id FROM entries WHERE id = ${id}`
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  // Replace all players in a transaction
  await sql`DELETE FROM entry_players WHERE entry_id = ${id}`
  for (let i = 0; i < playerNames.length; i++) {
    await sql`
      INSERT INTO entry_players (entry_id, player_name, position)
      VALUES (${id}, ${playerNames[i].trim()}, ${i + 1})
    `
  }
  await sql`UPDATE entries SET submitted_at = NOW() WHERE id = ${id}`

  return res.json({ entryId: id, playerNames, submittedAt: new Date().toISOString() })
}
```

#### `api/scores.js`

**Purpose**: Read and update player scores (scoring events).

```javascript
// GET  /api/scores — returns all scoring events (latest per player)
// POST /api/scores — bulk upsert player scores { players: [{ playerName, points }] }

import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT id, player_name AS "playerName", points, created_at AS "createdAt"
      FROM scoring_events ORDER BY created_at DESC
    `
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const { players } = req.body
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'players array required' })
    }

    const results = []
    for (const { playerName, points } of players) {
      if (!playerName || typeof points !== 'number') {
        results.push({ playerName, success: false, reason: 'Invalid data' })
        continue
      }

      const id = `score-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Upsert: delete old record for this player, insert new
      await sql`DELETE FROM scoring_events WHERE player_name = ${playerName}`
      await sql`
        INSERT INTO scoring_events (id, player_name, points)
        VALUES (${id}, ${playerName}, ${points})
      `

      // Count affected entries (entries that have this player)
      const { rows: affected } = await sql`
        SELECT DISTINCT e.id
        FROM entries e
        JOIN entry_players ep ON ep.entry_id = e.id
        WHERE LOWER(ep.player_name) = LOWER(${playerName})
      `

      // Recalculate total_score for affected entries
      for (const entry of affected) {
        const { rows: scoreRows } = await sql`
          SELECT COALESCE(SUM(se.points), 0) AS total
          FROM entry_players ep
          JOIN scoring_events se ON LOWER(se.player_name) = LOWER(ep.player_name)
          WHERE ep.entry_id = ${entry.id}
        `
        const newTotal = scoreRows[0]?.total ?? 0
        await sql`UPDATE entries SET total_score = ${newTotal} WHERE id = ${entry.id}`
      }

      // Log the update
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      await sql`
        INSERT INTO scoring_update_logs (id, player_name, points, entries_affected, success)
        VALUES (${logId}, ${playerName}, ${points}, ${affected.length}, true)
      `

      results.push({
        playerName,
        points,
        entriesAffected: affected.length,
        success: true
      })
    }

    return res.json({ results })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

#### `api/pool-data.js`

**Purpose**: Single endpoint to fetch all pool data in one request (for initial page load).

```javascript
// GET /api/pool-data — returns all pool data in one response

import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Fetch all data in parallel
  const [participantsResult, entriesResult, playersResult, scoresResult, logsResult] =
    await Promise.all([
      sql`SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt"
          FROM participants ORDER BY created_at ASC`,
      sql`SELECT id, email, participant_name AS "participantName",
                 total_score AS "totalScore",
                 created_at AS "createdAt", submitted_at AS "submittedAt"
          FROM entries ORDER BY created_at ASC`,
      sql`SELECT entry_id AS "entryId", player_name AS "playerName", position
          FROM entry_players ORDER BY position ASC`,
      sql`SELECT id, player_name AS "playerName", points, created_at AS "createdAt"
          FROM scoring_events ORDER BY created_at DESC`,
      sql`SELECT id, player_name AS "playerName", points,
                 entries_affected AS "entriesAffected", success, reason,
                 created_at AS "createdAt"
          FROM scoring_update_logs ORDER BY created_at DESC`
    ])

  // Group players by entry
  const playersByEntry = {}
  for (const p of playersResult.rows) {
    if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
    playersByEntry[p.entryId].push(p.playerName)
  }

  // Attach players to entries
  const entries = entriesResult.rows.map(e => ({
    ...e,
    playerNames: playersByEntry[e.id] || [],
    playerIds: playersByEntry[e.id] || [] // backward compat
  }))

  return res.json({
    participants: participantsResult.rows,
    entries,
    scoringEvents: scoresResult.rows,
    scoringUpdateLogs: logsResult.rows,
    lastUpdated: new Date().toISOString()
  })
}
```

### Component 2: apiService.js (NEW)

**Purpose**: Centralized HTTP client for all API calls from the frontend.

```javascript
// src/services/apiService.js

const API_BASE = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  }
  const response = await fetch(url, config)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

export const apiService = {
  // Pool data (bulk fetch)
  fetchPoolData: () => request('/pool-data'),

  // Participants
  getParticipants: () => request('/participants'),
  createParticipant: (email, name, entryFee) =>
    request('/participants', { method: 'POST', body: { email, name, entryFee } }),
  deleteParticipant: (email) =>
    request(`/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' }),

  // Entries
  getEntries: () => request('/entries'),
  createEntry: (email, participantName) =>
    request('/entries', { method: 'POST', body: { email, participantName } }),
  deleteEntry: (id) =>
    request(`/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Entry players
  assignPlayers: (entryId, playerNames) =>
    request(`/entries/${encodeURIComponent(entryId)}/players`, {
      method: 'PUT',
      body: { playerNames }
    }),

  // Scores
  getScores: () => request('/scores'),
  updateScores: (players) =>
    request('/scores', { method: 'POST', body: { players } })
}
```

### Component 3: TeamsView (NEW — replaces PlayerSelectorView)

**Purpose**: Read-only view showing all entries and which players each participant picked.

```javascript
// src/views/TeamsView.vue
// Reads from Pinia stores (entries, participants)
// No props, no emits — purely read-only

// Computed:
//   entriesWithDetails — entries enriched with participant name and player list
//   sortedEntries — sorted by participant name alphabetically

// Template:
//   - Entry cards: participant name, entry ID, numbered list of 15 players
//   - Score per entry
//   - Empty state when no entries exist
//   - Dark mode styling consistent with app theme
```

**Responsibilities**:
- Display all entries from the entries store
- Show player names for each entry in a numbered list
- Show total score per entry
- No submission, editing, or deletion controls

### Component 4: AdminView (MODIFIED)

**Purpose**: Extended to include player entry management (moved from PlayerSelectorView) and API-backed operations.

**Changes from current AdminView**:
- All CRUD operations now call `apiService` instead of directly mutating Pinia stores + localStorage
- New section: "Assign Players to Entry" — select participant, select entry, textarea for 15 player names
- Player stats processing now calls `POST /api/scores` instead of writing to localStorage
- Remove `exportPoolDataJSON()` (no longer needed — data lives in Postgres)
- Remove all `saveToStorage()` / `loadFromStorage()` calls for shared data
- Keep localStorage only for admin auth state (`isAuthenticated`)

**New methods**:
```javascript
// Assign players to an entry via API
async function assignPlayersToEntry(entryId, playerNamesText) {
  const playerNames = playerNamesText
    .split(/[\n,]+/)
    .map(name => name.trim())
    .filter(name => name.length > 0)

  if (playerNames.length !== 15) {
    throw new Error('Must provide exactly 15 player names')
  }

  await apiService.assignPlayers(entryId, playerNames)
  // Refresh entries store from API
  await refreshEntries()
}

// Process player stats via API
async function processPlayerStats(statsText) {
  const lines = statsText.trim().split('\n')
  const players = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 2) continue
    const pts = parseInt(parts[parts.length - 1])
    const playerName = parts.slice(0, -1).join(' ')
    if (!isNaN(pts) && pts >= 0) {
      players.push({ playerName, points: pts })
    }
  }
  const result = await apiService.updateScores(players)
  // Refresh all data to reflect new scores
  await refreshPoolData()
  return result
}
```

### Component 5: Pinia Stores (MODIFIED)

**Purpose**: All stores updated to be hydrated from API responses instead of localStorage.

| Store | Current Source | New Source | localStorage Retained? |
|-------|---------------|-----------|----------------------|
| participants | localStorage | API (`/api/participants`) | No |
| entries | localStorage | API (`/api/entries`) | No |
| scores | localStorage | API (`/api/scores`) | No |
| scoringUpdates | localStorage | API (via `/api/pool-data`) | No |
| scoringEngine | localStorage | Removed (scoring logic moves to API) | No |
| playerSelection | in-memory | Removed (functionality in AdminView) | N/A |
| playerRegistry | localStorage | Removed (replaced by scoring_events table) | No |

Each remaining store gains a `hydrateFromData(data)` method:

```javascript
// participants store
function hydrateFromData(participantsArray) {
  participants.value = participantsArray
}

// entries store
function hydrateFromData(entriesArray) {
  entries.value = entriesArray
}

// scores store — now holds scoring events from API
function hydrateFromData(scoringEventsArray) {
  scoringEvents.value = scoringEventsArray
}
```

Remove from all stores:
- `saveToStorage()` method
- `loadFromStorage()` method
- All `localStorage.getItem()` / `localStorage.setItem()` calls for shared data

### Component 6: App.vue (MODIFIED)

**Changes**:
- Middle tab renamed from "Player Selection" to "Teams"
- Middle tab renders `TeamsView` instead of `PlayerSelectorView`
- Import `TeamsView` instead of `PlayerSelectorView`

```javascript
// Before:
// <button @click="currentView = 'player-selector'">Player Selection</button>
// import PlayerSelectorView from './views/PlayerSelectorView.vue'

// After:
// <button @click="currentView = 'teams'">Teams</button>
// import TeamsView from './views/TeamsView.vue'
```

### Component 7: main.js (MODIFIED)

**Changes**: Replace localStorage loading with API fetch on startup.

```javascript
import { apiService } from './services/apiService'

// Replace:
//   participantsStore.loadFromStorage()
//   entriesStore.loadFromStorage()
//   scoresStore.loadFromStorage()
//   scoringEngineStore.loadProcessedEvents()

// With:
try {
  const data = await apiService.fetchPoolData()
  participantsStore.hydrateFromData(data.participants)
  entriesStore.hydrateFromData(data.entries)
  scoresStore.hydrateFromData(data.scoringEvents)
} catch (error) {
  console.error('Failed to load pool data from API:', error)
}
```

## Data Models

### API Response: GET /api/pool-data

```javascript
{
  lastUpdated: "2025-06-01T12:00:00.000Z",  // ISO 8601 timestamp
  participants: [
    {
      email: "steve@example.com",       // VARCHAR(255), PK
      name: "Steve",                     // VARCHAR(255)
      entryFee: 20.00,                  // NUMERIC(10,2)
      createdAt: "2025-05-01T10:00:00Z" // TIMESTAMPTZ
    }
  ],
  entries: [
    {
      id: "entry-1717200000000-abc123def",  // VARCHAR(100), PK
      email: "steve@example.com",            // FK → participants.email
      participantName: "Steve",
      totalScore: 24,                        // INTEGER, computed from scoring_events
      createdAt: "2025-05-01T10:05:00Z",
      submittedAt: "2025-05-01T10:10:00Z",
      playerNames: [                         // From entry_players JOIN
        "Nathan MacKinnon",
        "Cale Makar"
        // ... up to 15
      ],
      playerIds: [/* same as playerNames, backward compat */]
    }
  ],
  scoringEvents: [
    {
      id: "score-1717200000000-xyz789",
      playerName: "Nathan MacKinnon",
      points: 12,
      createdAt: "2025-06-01T12:00:00Z"
    }
  ],
  scoringUpdateLogs: [
    {
      id: "log-1717200000000-qrs456",
      playerName: "Nathan MacKinnon",
      points: 12,
      entriesAffected: 2,
      success: true,
      reason: null,
      createdAt: "2025-06-01T12:00:00Z"
    }
  ]
}
```

**Validation Rules**:
- `participants`: array; each must have `email` (non-empty string), `name` (non-empty string), `entryFee` (number >= 0)
- `entries`: array; each must have `id` (string), `email` (string matching a participant), `playerNames` (array of strings, max 15)
- `scoringEvents`: array; each must have `playerName` (string), `points` (number >= 0)
- `scoringUpdateLogs`: array
- All timestamps must be valid ISO 8601

## Algorithmic Pseudocode

### Score Recalculation Algorithm (Server-Side)

When admin posts new player scores via `POST /api/scores`, the server recalculates `total_score` for all affected entries:

```javascript
// Inside api/scores.js POST handler

ALGORITHM recalculateEntryScores(playerName, points)
INPUT: playerName (string), points (integer >= 0)
OUTPUT: list of affected entry IDs with updated scores

BEGIN
  // Step 1: Upsert the scoring event
  DELETE FROM scoring_events WHERE player_name = playerName
  INSERT INTO scoring_events (id, player_name, points) VALUES (newId, playerName, points)

  // Step 2: Find all entries containing this player
  affectedEntries = SELECT DISTINCT e.id
    FROM entries e
    JOIN entry_players ep ON ep.entry_id = e.id
    WHERE LOWER(ep.player_name) = LOWER(playerName)

  // Step 3: Recalculate total_score for each affected entry
  FOR EACH entry IN affectedEntries DO
    // Sum points from all scoring_events matching this entry's players
    newTotal = SELECT COALESCE(SUM(se.points), 0)
      FROM entry_players ep
      JOIN scoring_events se ON LOWER(se.player_name) = LOWER(ep.player_name)
      WHERE ep.entry_id = entry.id

    UPDATE entries SET total_score = newTotal WHERE id = entry.id
  END FOR

  // Step 4: Log the update
  INSERT INTO scoring_update_logs (...)

  RETURN affectedEntries
END
```

**Preconditions:**
- `playerName` is a non-empty string
- `points` is a non-negative integer
- Database connection is available

**Postconditions:**
- `scoring_events` contains exactly one row for this player (latest)
- All entries containing this player have `total_score` recalculated as the sum of their players' points
- A log entry is created in `scoring_update_logs`

**Loop Invariant:**
- After processing each entry, that entry's `total_score` equals the sum of `scoring_events.points` for all its players

### Standings Calculation Algorithm (Client-Side)

```javascript
// StandingsView.vue — computed property

ALGORITHM calculateStandings(entries, scoringEvents)
INPUT: entries (array), scoringEvents (array)
OUTPUT: sorted array of entries with calculated scores

BEGIN
  // Step 1: Build player → points lookup from scoring events
  playerPointsMap = new Map()
  FOR EACH event IN scoringEvents DO
    playerPointsMap.set(LOWER(event.playerName), event.points)
  END FOR

  // Step 2: Calculate score for each entry
  FOR EACH entry IN entries DO
    calculatedScore = 0
    FOR EACH playerName IN entry.playerNames DO
      points = playerPointsMap.get(LOWER(playerName)) OR 0
      calculatedScore += points
    END FOR
    entry.calculatedScore = calculatedScore
  END FOR

  // Step 3: Sort by score descending, tiebreak by createdAt ascending
  SORT entries BY (calculatedScore DESC, createdAt ASC)

  RETURN entries
END
```

**Preconditions:**
- `entries` is a valid array with `playerNames` arrays
- `scoringEvents` is a valid array with `playerName` and `points`

**Postconditions:**
- Each entry has a `calculatedScore` field
- Entries are sorted by score descending
- Ties are broken by earliest `createdAt` first

### App Initialization Algorithm

```javascript
ALGORITHM initializeApp()
OUTPUT: App mounted with data from Postgres

BEGIN
  // Step 1: Create Vue app and Pinia
  app = createApp(App)
  pinia = createPinia()
  app.use(pinia)

  // Step 2: Fetch all pool data from API
  TRY
    data = await apiService.fetchPoolData()

    // Step 3: Hydrate stores
    participantsStore.hydrateFromData(data.participants)
    entriesStore.hydrateFromData(data.entries)
    scoresStore.hydrateFromData(data.scoringEvents)
  CATCH error
    console.error('Failed to load pool data:', error)
    // App renders with empty stores — admin can still access admin panel
  END TRY

  // Step 4: Mount app
  app.mount('#app')
END
```

**Preconditions:**
- DOM element `#app` exists
- API is reachable (or app gracefully handles failure)

**Postconditions:**
- App is mounted and rendering
- If API succeeded: stores contain data from Postgres
- If API failed: stores are empty, error is logged

## Key Functions with Formal Specifications

### Function 1: apiService.fetchPoolData()

```javascript
async function fetchPoolData() {
  return request('/pool-data')
}
```

**Preconditions:**
- API server is reachable
- Database tables exist and are populated (or empty)

**Postconditions:**
- Returns object with `participants`, `entries`, `scoringEvents`, `scoringUpdateLogs`, `lastUpdated`
- All arrays are valid (may be empty)
- Throws Error if HTTP response is not 2xx

### Function 2: api/scores.js POST handler

```javascript
async function handleScoresPost(req, res) { /* see full implementation above */ }
```

**Preconditions:**
- `req.body.players` is a non-empty array of `{ playerName, points }` objects
- Database connection is available

**Postconditions:**
- For each valid player: `scoring_events` table has exactly one row (upserted)
- All entries containing updated players have `total_score` recalculated
- `scoring_update_logs` has a new row for each processed player
- Returns `{ results: [...] }` with success/failure per player

**Loop Invariant:**
- After processing player `i`, all entries containing players `0..i` have correct `total_score`

### Function 3: api/entries/[id]/players.js PUT handler

```javascript
async function handleAssignPlayers(req, res) { /* see full implementation above */ }
```

**Preconditions:**
- `req.query.id` is a valid entry ID that exists in the database
- `req.body.playerNames` is an array of exactly 15 non-empty strings

**Postconditions:**
- `entry_players` table has exactly 15 rows for this entry (old rows deleted, new inserted)
- `entries.submitted_at` is updated to current timestamp
- Returns the entry ID and player names

### Function 4: participantsStore.hydrateFromData()

```javascript
function hydrateFromData(participantsArray) {
  participants.value = participantsArray
}
```

**Preconditions:**
- `participantsArray` is a valid array of participant objects from the API

**Postconditions:**
- `participants.value` contains exactly the provided array
- No localStorage read or write occurs
- Previous state is fully replaced

### Function 5: apiService.request() (internal)

```javascript
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  }
  const response = await fetch(url, config)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}
```

**Preconditions:**
- `path` starts with `/`
- `options.body` is a plain object (will be JSON-stringified) or undefined

**Postconditions:**
- Returns parsed JSON response on 2xx
- Throws Error with server error message on non-2xx
- Content-Type header is always set to application/json

## Example Usage

### App Startup (main.js)

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { apiService } from './services/apiService'
import { useParticipantsStore } from './stores/participants'
import { useEntriesStore } from './stores/entries'
import { useScoresStore } from './stores/scores'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Fetch data from Postgres via API
try {
  const data = await apiService.fetchPoolData()
  const participantsStore = useParticipantsStore()
  const entriesStore = useEntriesStore()
  const scoresStore = useScoresStore()

  participantsStore.hydrateFromData(data.participants)
  entriesStore.hydrateFromData(data.entries)
  scoresStore.hydrateFromData(data.scoringEvents)
} catch (error) {
  console.error('Failed to load pool data:', error)
}

app.mount('#app')
```

### Admin: Add Participant

```javascript
// In AdminView.vue
async function addParticipant() {
  try {
    const result = await apiService.createParticipant(
      newParticipant.value.email,
      newParticipant.value.name,
      newParticipant.value.entryFee
    )
    // Refresh participants from API
    const data = await apiService.getParticipants()
    participantsStore.hydrateFromData(data)
  } catch (error) {
    participantError.value = error.message
  }
}
```

### Admin: Process Player Stats

```javascript
// In AdminView.vue
async function processPlayerStats() {
  const lines = playerStatsInput.value.trim().split('\n')
  const players = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 2) continue
    const pts = parseInt(parts[parts.length - 1])
    const playerName = parts.slice(0, -1).join(' ')
    if (!isNaN(pts) && pts >= 0) {
      players.push({ playerName, points: pts })
    }
  }

  const { results } = await apiService.updateScores(players)
  // Refresh all data to reflect recalculated scores
  const data = await apiService.fetchPoolData()
  entriesStore.hydrateFromData(data.entries)
  scoresStore.hydrateFromData(data.scoringEvents)
}
```

### TeamsView: Display Entries

```javascript
// In TeamsView.vue
const entriesStore = useEntriesStore()
const participantsStore = useParticipantsStore()

const entriesWithDetails = computed(() => {
  return entriesStore.entries
    .map(entry => ({
      ...entry,
      participantName: participantsStore.getParticipant(entry.email)?.name || entry.participantName,
      playerCount: (entry.playerNames || []).length
    }))
    .sort((a, b) => a.participantName.localeCompare(b.participantName))
})
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CRUD Round-Trip for Participants and Entries

*For any* valid participant (with email and name) or entry (with email and participantName), creating it via POST and then fetching via GET SHALL return a collection that includes the created record with matching field values.

**Validates: Requirements 2.1, 2.2, 3.1, 3.2**

### Property 2: Delete Round-Trip for Participants and Entries

*For any* participant or entry that exists in the database, deleting it via DELETE and then fetching via GET SHALL return a collection that does not include the deleted record.

**Validates: Requirements 2.4, 3.4**

### Property 3: API Validation Rejects Missing Required Fields

*For any* POST request to `/api/participants` missing email or name, or POST to `/api/entries` missing email or participantName, or POST to `/api/scores` with empty/missing players array, the API SHALL return HTTP 400.

**Validates: Requirements 2.3, 3.3, 5.5**

### Property 4: Unsupported HTTP Methods Return 405

*For any* HTTP method not supported by a given API route (e.g., PATCH on `/api/participants`, POST on `/api/pool-data`), the API SHALL return HTTP 405.

**Validates: Requirements 2.6, 3.6, 4.4, 6.3**

### Property 5: Player Assignment Round-Trip with Order Preservation

*For any* entry and any array of exactly 15 player names, assigning them via PUT and then fetching the entry via GET SHALL return those exact 15 player names in the same order, with submitted_at set.

**Validates: Requirements 4.1, 4.5**

### Property 6: Player Assignment Rejects Invalid Counts

*For any* array of player names where the length is not exactly 15, the PUT to `/api/entries/[id]/players` SHALL return HTTP 400.

**Validates: Requirements 4.2, 11.3**

### Property 7: Score Recalculation Invariant

*For any* set of scoring events posted via `POST /api/scores`, the `total_score` of every entry SHALL equal the sum of `scoring_events.points` for all players in that entry, using case-insensitive player name matching.

**Validates: Requirements 5.3, 5.7**

### Property 8: Scoring Event Upsert Idempotency

*For any* player name submitted to `POST /api/scores` multiple times, the `scoring_events` table SHALL contain exactly one row for that player (the latest value), not multiple rows.

**Validates: Requirements 5.2**

### Property 9: Scoring Update Logging

*For any* scoring event upserted via `POST /api/scores`, a corresponding scoring_update_log entry SHALL be created recording the player name, points, affected entry count, and success status.

**Validates: Requirements 5.4**

### Property 10: Mixed Valid/Invalid Score Processing

*For any* players array containing a mix of valid entries (with playerName and numeric points) and invalid entries (missing fields or non-numeric points), the API SHALL mark invalid entries as failed and successfully process valid entries.

**Validates: Requirements 5.6**

### Property 11: Pool Data Response Completeness

*For any* call to `GET /api/pool-data`, the response SHALL include all participants, all entries (with playerNames and playerIds arrays attached), all scoring events, all scoring update logs, and a lastUpdated timestamp.

**Validates: Requirements 6.1, 6.4, 14 (backward compat from Property 14 below)**

### Property 12: API Service Error Propagation

*For any* API response with a non-OK HTTP status, the API_Service SHALL throw an Error containing the error message from the response body.

**Validates: Requirements 7.2**

### Property 13: Store Hydration Replaces State

*For any* array of data passed to a Pinia store's `hydrateFromData` method, the store's state SHALL be replaced entirely with that array, regardless of previous state.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 14: Backward Compatibility of Entry Structure

*For any* entry returned by the API, the response SHALL include both `playerNames` (array of strings) and `playerIds` (array, same values) to maintain compatibility with existing frontend code.

**Validates: Requirements 6.4**

### Property 15: TeamsView Displays All Entries Read-Only

*For any* set of entries in the store, the TeamsView SHALL display each entry's participant name, entry ID, numbered player names, and total score, sorted alphabetically by participant name, with no submission, editing, or deletion controls.

**Validates: Requirements 10.1, 10.2, 10.4, 10.5**

### Property 16: Cascade Delete Integrity

*For any* participant deleted via the API, all entries belonging to that participant and all entry_players belonging to those entries SHALL also be deleted.

**Validates: Requirements 1.5, 1.6**

### Property 17: Graceful API Failure on Startup

*For any* failed fetchPoolData call on app startup, the application SHALL render with empty stores and remain functional (admin panel accessible).

**Validates: Requirements 14.1, 14.2**

### Property 18: Standings Sort Order

*For any* set of entries displayed in StandingsView, entries SHALL be sorted by total score descending, with ties broken by earliest `createdAt` first.

**Validates: Requirements 5.3 (score correctness feeds into standings)**

## Error Handling

### Error Scenario 1: Database Connection Failure

**Condition**: Vercel Postgres / Neon is unreachable (connection timeout, DNS failure)
**Response**: API returns 500 with `{ error: "Database connection failed" }`
**Recovery**: Frontend displays "Unable to load pool data. Please try again later." App renders with empty stores.

### Error Scenario 2: API Route Not Found (404)

**Condition**: Frontend calls an API route that doesn't exist
**Response**: Vercel returns 404
**Recovery**: `apiService.request()` throws Error; calling code catches and displays error message.

### Error Scenario 3: Invalid Request Body

**Condition**: Frontend sends malformed data (missing required fields, wrong types)
**Response**: API returns 400 with descriptive error message
**Recovery**: Frontend displays the error message to the admin. No database mutation occurs.

### Error Scenario 4: Duplicate Participant Email

**Condition**: Admin tries to create a participant with an email that already exists
**Response**: Postgres raises unique constraint violation; API returns 500 (or catches and returns 409)
**Recovery**: Frontend displays "Participant with this email already exists."

### Error Scenario 5: Foreign Key Violation on Entry Creation

**Condition**: Admin tries to create an entry for a non-existent participant email
**Response**: Postgres raises FK violation; API returns 400
**Recovery**: Frontend displays error. Admin must create the participant first.

### Error Scenario 6: Network Failure on Frontend

**Condition**: User's browser cannot reach the API (offline, DNS issues)
**Response**: `fetch()` throws TypeError; `apiService.request()` propagates the error
**Recovery**: Frontend displays "Network error. Check your connection and try again."

### Error Scenario 7: Entry Not Found for Player Assignment

**Condition**: Admin tries to assign players to an entry ID that doesn't exist
**Response**: API returns 404 with `{ error: "Entry not found" }`
**Recovery**: Frontend displays error. Admin should refresh entries list.

## Testing Strategy

### Unit Testing Approach

**API Route Tests** (mock `@vercel/postgres` sql template tag):
- `GET /api/participants` returns all participants sorted by created_at
- `POST /api/participants` creates participant, returns 201
- `POST /api/participants` with missing email returns 400
- `DELETE /api/participants` removes participant and cascaded entries
- `GET /api/entries` returns entries with player names joined
- `POST /api/entries` creates entry with generated ID
- `PUT /api/entries/:id/players` with 15 names succeeds
- `PUT /api/entries/:id/players` with != 15 names returns 400
- `PUT /api/entries/:id/players` with nonexistent entry returns 404
- `POST /api/scores` upserts scoring events and recalculates entry scores
- `GET /api/pool-data` returns complete pool data structure

**apiService Tests** (mock fetch):
- `fetchPoolData()` returns parsed JSON on 200
- `fetchPoolData()` throws on 500
- `createParticipant()` sends correct POST body
- `assignPlayers()` sends PUT with playerNames array
- `updateScores()` sends POST with players array
- Error responses are parsed and thrown as Error objects

**Store Hydration Tests**:
- `hydrateFromData()` replaces store state with provided array
- `hydrateFromData([])` results in empty store
- No localStorage calls during hydration

**TeamsView Tests**:
- Renders entry cards with participant names and player lists
- Does not render any submit/edit/delete buttons
- Shows empty state when no entries exist
- Displays correct player count per entry

**AdminView Tests**:
- Player assignment form validates exactly 15 names
- Calls `apiService.assignPlayers()` on submit
- Calls `apiService.updateScores()` when processing player stats
- Calls `apiService.createParticipant()` when adding participant
- Displays API error messages to admin

**App.vue Tests**:
- Middle tab renders TeamsView, not PlayerSelectorView
- Tab label is "Teams", not "Player Selection"

### Property-Based Testing Approach

**Property Test Library**: fast-check

- Generate random valid participant objects → verify `POST /api/participants` accepts them
- Generate random arrays of 15 player names → verify `PUT /api/entries/:id/players` accepts them
- Generate random arrays of != 15 player names → verify API rejects them
- Generate random scoring events → verify entry `total_score` equals sum of player points
- Generate random pool data → verify `hydrateFromData()` correctly populates stores
- Generate random entries with scores → verify standings sort order (descending score, ascending createdAt tiebreak)

### Integration Testing Approach

- Full flow: create participant → create entry → assign 15 players → update scores → verify standings reflect correct totals
- Full flow: `GET /api/pool-data` → hydrate stores → TeamsView shows all entries read-only
- Error flow: API returns 500 → app shows error state, doesn't crash
- Cascade flow: delete participant → verify entries and entry_players are also deleted
- Score recalculation flow: update player score → verify all entries containing that player have correct total_score

## Performance Considerations

- `GET /api/pool-data` runs 5 parallel SQL queries. For a small pool (~6 participants, ~20 entries), this completes in <100ms.
- Scoring updates recalculate `total_score` per affected entry. With ~20 entries and ~15 players each, this is at most ~20 UPDATE statements per scoring batch — well within serverless function time limits.
- No polling or WebSocket needed. Data refreshes on page load. For a small pool, this is sufficient.
- Vercel serverless functions cold-start in ~200ms. Subsequent requests reuse warm instances.
- Neon serverless Postgres supports connection pooling, so concurrent requests don't exhaust connections.

## Security Considerations

- API routes are publicly accessible (no auth middleware). This is acceptable for a small friends-only pool where all data (names, picks, scores) is meant to be visible.
- Admin password remains hardcoded in AdminView (existing behavior). Only admin-authenticated users can trigger write operations from the UI, but the API endpoints themselves are not auth-protected.
- `POSTGRES_URL` is stored as an environment variable in Vercel (not committed to git). For local dev, it's in `.env.local` (gitignored).
- SQL injection is prevented by using `@vercel/postgres` tagged template literals, which parameterize all values.
- No sensitive PII beyond email addresses, which participants voluntarily provide.

## Dependencies

- **@vercel/postgres** — Vercel's Postgres client for serverless functions (NEW — must be added to package.json)
- **Vue.js 3** — SPA framework (existing)
- **Pinia** — State management (existing)
- **Vite** — Build tool (existing)
- **Vercel** — Hosting platform with serverless functions and Postgres (existing hosting, new Postgres addon)
- **fetch API** — Browser-native HTTP client, no additional library needed
- **fast-check** — Property-based testing (existing dev dependency)
- **Local Postgres** — For development and testing (developer's local machine)

## Environment Configuration

### Production (Vercel)
- `POSTGRES_URL` — Set in Vercel dashboard → Settings → Environment Variables
- Automatically provisioned when adding Vercel Postgres from the Vercel dashboard
- Also sets `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` (but `@vercel/postgres` uses `POSTGRES_URL`)

### Local Development
- `.env.local` (gitignored):
  ```
  POSTGRES_URL=postgres://user:password@localhost:5432/nhl_playoff_pool
  ```
- Run `psql $POSTGRES_URL -f migrate.sql` to set up local tables
- Vercel CLI (`vercel dev`) serves API routes locally against local Postgres

### vercel.json Updates

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The API rewrite rule must come before the SPA catch-all to ensure `/api/*` requests reach the serverless functions.
