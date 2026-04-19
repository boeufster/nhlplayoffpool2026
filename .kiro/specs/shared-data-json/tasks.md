# Tasks — Shared Data: Vercel Postgres Migration

## Task 1: Database Setup and Migration Script
- [x] 1.1 Create `migrate.sql` in project root with all CREATE TABLE statements wrapped in BEGIN/COMMIT
- [x] 1.2 Add `@vercel/postgres` to package.json dependencies
- [x] 1.3 Update `.env.local` with POSTGRES_URL placeholder for local development
- [x] 1.4 Update `vercel.json` to add API rewrite rule before the SPA catch-all

## Task 2: API Routes — Participants
- [x] 2.1 Create `api/participants.js` with GET (list all), POST (create), DELETE (remove by email) handlers
- [x] 2.2 Add input validation: return 400 for missing email/name on POST, missing email on DELETE
- [x] 2.3 Return 405 for unsupported HTTP methods

## Task 3: API Routes — Entries
- [x] 3.1 Create `api/entries.js` with GET (list all with player names via JOIN), POST (create), DELETE (remove by id) handlers
- [x] 3.2 Add input validation: return 400 for missing email/participantName on POST, missing id on DELETE
- [x] 3.3 Return 405 for unsupported HTTP methods

## Task 4: API Routes — Player Assignment
- [x] 4.1 Create `api/entries/[id]/players.js` with PUT handler that replaces all entry_players for the given entry
- [x] 4.2 Validate exactly 15 player names, return 400 otherwise
- [x] 4.3 Verify entry exists, return 404 if not found
- [x] 4.4 Store player names with 1-based position values and set submitted_at on the entry

## Task 5: API Routes — Scores
- [x] 5.1 Create `api/scores.js` with GET (list scoring events) and POST (bulk upsert) handlers
- [x] 5.2 Implement upsert logic: delete old scoring_event for player, insert new
- [x] 5.3 Implement score recalculation: recompute total_score for all entries containing the updated player using case-insensitive matching
- [x] 5.4 Create scoring_update_log entries for each processed player
- [x] 5.5 Handle mixed valid/invalid players: mark invalid as failed, continue processing valid ones

## Task 6: API Routes — Pool Data Bulk Fetch
- [x] 6.1 Create `api/pool-data.js` with GET handler that returns participants, entries (with playerNames/playerIds), scoringEvents, scoringUpdateLogs, and lastUpdated
- [x] 6.2 Execute all queries in parallel with Promise.all
- [x] 6.3 Return 405 for non-GET methods

## Task 7: Frontend API Service
- [x] 7.1 Create `src/services/apiService.js` with centralized request function and methods for all API operations
- [x] 7.2 Implement error handling: throw Error with response body message on non-OK status
- [x] 7.3 Set Content-Type to application/json and JSON-stringify request bodies

## Task 8: Update Pinia Stores
- [x] 8.1 Add `hydrateFromData(data)` method to participants store, remove saveToStorage/loadFromStorage and all localStorage calls
- [x] 8.2 Add `hydrateFromData(data)` method to entries store, remove saveToStorage/loadFromStorage and all localStorage calls
- [x] 8.3 Add `hydrateFromData(data)` method to scores store, remove saveToStorage/loadFromStorage and all localStorage calls
- [x] 8.4 Remove scoringUpdates store localStorage methods (data comes from API pool-data response)

## Task 9: Remove Obsolete Stores
- [x] 9.1 Delete `src/stores/playerSelection.js` and remove all imports/references
- [x] 9.2 Delete `src/stores/playerRegistry.js` and remove all imports/references
- [x] 9.3 Delete `src/stores/scoringEngine.js` and remove all imports/references

## Task 10: Create TeamsView
- [x] 10.1 Create `src/views/TeamsView.vue` — read-only view displaying all entries with participant name, entry ID, numbered player list, and total score
- [x] 10.2 Sort entries alphabetically by participant name
- [x] 10.3 Show empty state when no entries exist
- [x] 10.4 Apply dark mode styling consistent with app theme

## Task 11: Update AdminView
- [x] 11.1 Add "Assign Players to Entry" section with participant selector, entry selector, and textarea for 15 player names
- [x] 11.2 Replace all direct store mutations + localStorage calls with apiService method calls (createParticipant, deleteParticipant, createEntry, deleteEntry)
- [x] 11.3 Update player stats processing to call apiService.updateScores and refresh pool data after
- [x] 11.4 Add error display for API failures on all admin operations
- [x] 11.5 Remove exportPoolDataJSON and localStorage save/load calls for shared data (keep localStorage only for admin auth state)

## Task 12: Update App.vue Navigation
- [x] 12.1 Replace PlayerSelectorView import with TeamsView import
- [x] 12.2 Rename middle tab label from "Player Selection" to "Teams"
- [x] 12.3 Update currentComponent logic to render TeamsView for the 'teams' view key

## Task 13: Update main.js Startup
- [x] 13.1 Replace localStorage loading calls with apiService.fetchPoolData + store hydration
- [x] 13.2 Add try/catch for graceful failure — app renders with empty stores if API is unreachable
- [x] 13.3 Remove imports of obsolete stores (scoringEngine, playerRegistry, playerSelection)

## Task 14: Update StandingsView
- [x] 14.1 Replace localStorage-based player stats loading with scores from the Pinia scores store (hydrated from API)
- [x] 14.2 Remove auto-refresh interval that polls localStorage — data comes from API on page load
- [x] 14.3 Calculate standings from scoring events in the scores store using case-insensitive player name matching

## Task 15: Tests
- [x] 15.1 Write unit tests for apiService (mock fetch, verify request format, error handling)
- [x] 15.2 Write unit tests for store hydration (hydrateFromData replaces state correctly)
- [x] 15.3 Write unit tests for TeamsView (renders entries read-only, empty state, no edit controls)
- [x] 15.4 Write property tests: player assignment rejects arrays with length != 15
- [x] 15.5 Write property tests: score recalculation invariant — entry total_score equals sum of player points
- [x] 15.6 Write property tests: standings sort order — descending score, ascending createdAt tiebreak
- [x] 15.7 Update or remove existing tests that reference localStorage or removed stores
