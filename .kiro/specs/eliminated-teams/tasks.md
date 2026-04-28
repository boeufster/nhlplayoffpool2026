# Implementation Plan: Eliminated Teams

## Overview

Add team elimination tracking to the NHL playoff pool. This involves database schema changes, a new API endpoint, modifications to existing APIs, a new Pinia store, and UI updates across AdminView, TeamsView, and StandingsView. Implementation proceeds bottom-up: schema → shared parser → API layer → store → UI.

## Tasks

- [x] 1. Database schema and shared parser
  - [x] 1.1 Add `eliminated_teams` table and `team` column to `entry_players` in `migrate.sql`
    - Add `CREATE TABLE IF NOT EXISTS eliminated_teams (team_code VARCHAR(10) PRIMARY KEY, eliminated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
    - Add `ALTER TABLE entry_players ADD COLUMN IF NOT EXISTS team VARCHAR(10) DEFAULT NULL`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 1.2 Create `parsePlayerNameAndTeam` utility function
    - Create a shared module (e.g. `src/utils/parsePlayerNameAndTeam.js`) exporting the parser function
    - The function splits on whitespace, checks if the last token matches `/^[A-Z]{2,4}$/`, and returns `{ playerName, team }`
    - If no valid team suffix, return the full trimmed string as `playerName` and `null` as `team`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.3 Write property tests for `parsePlayerNameAndTeam`
    - **Property 1: Parser team extraction round-trip** — For any non-empty name and valid team code, `parsePlayerNameAndTeam(name + " " + team)` returns the original name and team
    - **Property 2: Parser no-team preservation** — For any string not ending with a 2-4 uppercase letter token, returns full trimmed string and null team
    - **Property 3: Parser whitespace invariance** — Parsing a string produces the same result as parsing its trimmed version
    - **Property 4: Parser non-empty name invariant** — For any non-empty input, the returned playerName is non-empty
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 2.3**

- [x] 2. API layer — eliminated teams endpoint and assign-players modification
  - [x] 2.1 Create `api/eliminated-teams.js` endpoint
    - GET: query `eliminated_teams` table, return array of team code strings
    - POST: validate `teams` array (each must match `/^[A-Z]{2,4}$/`), return 400 on invalid input
    - POST: delete all rows from `eliminated_teams`, insert each team with `ON CONFLICT DO NOTHING` for dedup
    - Return `{ eliminatedTeams: [...] }` on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Modify `api/assign-players.js` to parse team from player names
    - Import `parsePlayerNameAndTeam` (inline the function or use a shared copy since Vercel serverless functions don't bundle `src/`)
    - In the player insertion loop, call the parser on each raw name
    - Store `playerName` (clean, no team suffix) in `player_name` column and `team` in the new `team` column
    - Preserve position ordering
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Modify `api/pool-data.js` to include eliminated teams and player team data
    - Add `sql\`SELECT team_code AS "teamCode" FROM eliminated_teams ORDER BY eliminated_at ASC\`` to the parallel query array
    - Add `team` column to the `entry_players` SELECT query
    - Include `eliminatedTeams` array in the response (mapped from teamCode rows)
    - Attach team data to each entry's player list (e.g. `playerTeams` map keyed by lowercase player name)
    - Return `null` for players without a team code
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Checkpoint
  - Ensure all API changes are consistent and the database migration is correct. Ask the user if questions arise.

- [x] 4. Client store and API service
  - [x] 4.1 Create `src/stores/eliminatedTeams.js` Pinia store
    - Define `eliminatedTeams` ref (string array)
    - Implement `hydrateFromData(teamsArray)` — sets the ref, defaults to empty array if null/undefined
    - Implement `isTeamEliminated(teamCode)` — returns false for null/undefined, otherwise checks inclusion (uppercase)
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 4.2 Write property tests for `isPlayerEliminated` / `isTeamEliminated` logic
    - **Property 8: Elimination status correctness** — For any team code (or null) and any list of eliminated teams, `isTeamEliminated` returns true iff team is non-null and in the list
    - **Property 9: Points unaffected by elimination** — For any entries with scores and any eliminated teams set, total scores are identical regardless of elimination
    - **Property 10: Store hydration correctness** — For any array of valid team codes, hydrating and reading back returns the same array
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3**

  - [x] 4.3 Add `updateEliminatedTeams` and `getEliminatedTeams` methods to `src/services/apiService.js`
    - `getEliminatedTeams`: GET `/eliminated-teams`
    - `updateEliminatedTeams(teams)`: POST `/eliminated-teams` with `{ teams }` body
    - _Requirements: 3.1, 3.2_

  - [x] 4.4 Hydrate `eliminatedTeams` store from pool data in `App.vue` (or wherever `fetchPoolData` is consumed)
    - After fetching pool data, call `eliminatedTeamsStore.hydrateFromData(data.eliminatedTeams)`
    - Also hydrate in `AdminView.vue` `refreshPoolData` helper
    - _Requirements: 7.1_

- [x] 5. Checkpoint
  - Ensure the store hydrates correctly and API service methods work. Ask the user if questions arise.

- [x] 6. Admin UI for eliminated teams management
  - [x] 6.1 Add Eliminated Teams management section to `AdminView.vue`
    - Add a new `<section class="admin-section">` for eliminated teams (visible only when authenticated)
    - Include a textarea or input for entering team codes (comma or newline separated)
    - Display the current list of eliminated teams fetched from the server
    - Add a submit button that calls `apiService.updateEliminatedTeams(parsedCodes)` and updates the store on success
    - Show error messages from the API on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Visual indicators in TeamsView and StandingsView
  - [x] 7.1 Update `TeamsView.vue` to show eliminated player indicators
    - Import `useEliminatedTeamsStore`
    - Access player team data from the entry (attached via pool-data response)
    - Apply `player-eliminated` CSS class (strikethrough + muted opacity) to players whose team is eliminated
    - Show a team badge `<span>` next to each player name with the team code, styled with `eliminated` class when applicable
    - Players without a team code or on non-eliminated teams render normally
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Update `StandingsView.vue` to show eliminated player indicators
    - Import `useEliminatedTeamsStore`
    - In the player stats table, apply a visual eliminated indicator to players on eliminated teams
    - Preserve and display existing point totals without modification
    - _Requirements: 6.4, 6.5_

  - [x] 7.3 Add CSS styles for eliminated players
    - `.player-eliminated`: `text-decoration: line-through; opacity: 0.5; color: var(--text-secondary);`
    - `.team-badge`: small inline label with team code, styled differently when eliminated (e.g. `background: var(--error-color); color: #fff;`)
    - Ensure styles work across all themes
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `parsePlayerNameAndTeam` function needs to be available both in the Vercel serverless API (`api/`) and potentially in the frontend — since Vercel serverless functions don't share `src/`, the function should be inlined or duplicated in the API handler
- The `fast-check` library is already installed for property-based testing
