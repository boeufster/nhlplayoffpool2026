# Requirements Document

## Introduction

This document specifies the requirements for migrating the NHL Playoff Pool application from localStorage-based per-user data persistence to a shared Vercel Postgres database with serverless API routes. The database becomes the single source of truth for all users. The middle tab changes from a player submission view to a read-only Teams view, and player entry management moves into the AdminView.

## Glossary

- **Pool_App**: The NHL Playoff Pool Vue.js 3 single-page application
- **API_Service**: The centralized frontend HTTP client (`src/services/apiService.js`) that communicates with serverless API routes
- **API_Route**: A Vercel serverless function in the `api/` directory that performs CRUD operations against Postgres
- **Participants_API**: The serverless function at `/api/participants` handling participant CRUD
- **Entries_API**: The serverless function at `/api/entries` handling entry CRUD
- **Players_API**: The serverless function at `/api/entries/[id]/players` handling player assignment to entries
- **Scores_API**: The serverless function at `/api/scores` handling scoring event CRUD and entry score recalculation
- **PoolData_API**: The serverless function at `/api/pool-data` returning all pool data in a single response
- **Pinia_Store**: A Vue.js Pinia state management store that holds application data in memory
- **TeamsView**: The read-only Vue component replacing PlayerSelectorView, showing all entries and their player picks
- **AdminView**: The admin console Vue component for managing participants, entries, player assignments, and scoring
- **StandingsView**: The Vue component displaying ranked entries by score
- **Migration_Script**: The SQL script (`migrate.sql`) that creates all database tables
- **Score_Recalculation**: The server-side algorithm that recomputes an entry's total_score as the sum of its players' scoring_events points

## Requirements

### Requirement 1: Database Schema and Migration

**User Story:** As a pool administrator, I want a Postgres database with a well-defined schema, so that all pool data is stored centrally and shared across users.

#### Acceptance Criteria

1. THE Migration_Script SHALL create tables for participants, entries, entry_players, scoring_events, and scoring_update_logs using CREATE TABLE IF NOT EXISTS
2. WHEN the Migration_Script is executed, THE Migration_Script SHALL wrap all CREATE TABLE statements in a transaction (BEGIN/COMMIT)
3. THE Migration_Script SHALL enforce referential integrity with foreign keys: entries.email references participants.email with ON DELETE CASCADE, and entry_players.entry_id references entries.id with ON DELETE CASCADE
4. THE Migration_Script SHALL enforce uniqueness constraints on entry_players: UNIQUE(entry_id, player_name) and UNIQUE(entry_id, position)
5. WHEN a participant is deleted, THE database SHALL cascade the deletion to all entries belonging to that participant
6. WHEN an entry is deleted, THE database SHALL cascade the deletion to all entry_players rows belonging to that entry

### Requirement 2: Participants API

**User Story:** As a pool administrator, I want API endpoints to manage participants, so that participant data is persisted in the shared database.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/participants`, THE Participants_API SHALL return all participants ordered by created_at ascending as a JSON array
2. WHEN a POST request is sent to `/api/participants` with valid email, name, and optional entryFee, THE Participants_API SHALL insert the participant into the database and return the created record with HTTP 201
3. WHEN a POST request is sent to `/api/participants` without email or name, THE Participants_API SHALL return HTTP 400 with an error message
4. WHEN a DELETE request is sent to `/api/participants` with an email query parameter, THE Participants_API SHALL delete the participant and return the deleted email
5. WHEN a DELETE request is sent to `/api/participants` without an email query parameter, THE Participants_API SHALL return HTTP 400 with an error message
6. WHEN an unsupported HTTP method is sent to `/api/participants`, THE Participants_API SHALL return HTTP 405

### Requirement 3: Entries API

**User Story:** As a pool administrator, I want API endpoints to manage entries, so that entry data is persisted in the shared database with associated player names.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/entries`, THE Entries_API SHALL return all entries with their associated player names (from entry_players JOIN) ordered by created_at ascending
2. WHEN a POST request is sent to `/api/entries` with valid email and participantName, THE Entries_API SHALL insert the entry with a generated unique ID and return the created record with HTTP 201
3. WHEN a POST request is sent to `/api/entries` without email or participantName, THE Entries_API SHALL return HTTP 400 with an error message
4. WHEN a DELETE request is sent to `/api/entries` with an id query parameter, THE Entries_API SHALL delete the entry and return the deleted id
5. WHEN a DELETE request is sent to `/api/entries` without an id query parameter, THE Entries_API SHALL return HTTP 400 with an error message
6. WHEN an unsupported HTTP method is sent to `/api/entries`, THE Entries_API SHALL return HTTP 405

### Requirement 4: Player Assignment API

**User Story:** As a pool administrator, I want an API endpoint to assign exactly 15 players to an entry, so that player picks are stored in the database.

#### Acceptance Criteria

1. WHEN a PUT request is sent to `/api/entries/[id]/players` with an array of exactly 15 player names, THE Players_API SHALL replace all existing entry_players for that entry and set submitted_at to the current timestamp
2. WHEN a PUT request is sent with fewer or more than 15 player names, THE Players_API SHALL return HTTP 400 with an error message
3. WHEN a PUT request is sent for a non-existent entry ID, THE Players_API SHALL return HTTP 404 with an error message
4. WHEN a non-PUT HTTP method is sent to `/api/entries/[id]/players`, THE Players_API SHALL return HTTP 405
5. THE Players_API SHALL store each player name with a 1-based position value preserving the order of the input array

### Requirement 5: Scores API and Score Recalculation

**User Story:** As a pool administrator, I want an API endpoint to update player scores, so that entry totals are automatically recalculated based on their players' points.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/scores`, THE Scores_API SHALL return all scoring events ordered by created_at descending
2. WHEN a POST request is sent to `/api/scores` with a valid players array, THE Scores_API SHALL upsert each player's scoring event (delete old, insert new) and return results for each player
3. WHEN a scoring event is upserted for a player, THE Score_Recalculation SHALL recompute total_score for every entry containing that player as the sum of all its players' scoring_events points
4. WHEN a scoring event is upserted, THE Scores_API SHALL create a scoring_update_log entry recording the player name, points, number of affected entries, and success status
5. WHEN a POST request is sent to `/api/scores` with an empty or missing players array, THE Scores_API SHALL return HTTP 400 with an error message
6. WHEN a player in the players array has missing playerName or non-numeric points, THE Scores_API SHALL mark that player's result as failed with reason and continue processing remaining players
7. THE Score_Recalculation SHALL use case-insensitive matching (LOWER) when joining entry_players to scoring_events by player name

### Requirement 6: Pool Data Bulk Fetch API

**User Story:** As a user, I want all pool data loaded in a single API call on page load, so that the application starts quickly without multiple round trips.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/pool-data`, THE PoolData_API SHALL return a JSON object containing participants, entries (with player names), scoringEvents, scoringUpdateLogs, and a lastUpdated timestamp
2. THE PoolData_API SHALL execute all database queries in parallel using Promise.all for optimal performance
3. WHEN a non-GET HTTP method is sent to `/api/pool-data`, THE PoolData_API SHALL return HTTP 405
4. THE PoolData_API SHALL attach playerNames and playerIds (backward compatibility) arrays to each entry by joining with entry_players

### Requirement 7: Frontend API Service

**User Story:** As a developer, I want a centralized HTTP client for all API calls, so that API communication is consistent and error handling is unified.

#### Acceptance Criteria

1. THE API_Service SHALL provide methods for all API operations: fetchPoolData, getParticipants, createParticipant, deleteParticipant, getEntries, createEntry, deleteEntry, assignPlayers, getScores, and updateScores
2. WHEN an API response has a non-OK HTTP status, THE API_Service SHALL throw an Error with the error message from the response body
3. THE API_Service SHALL set Content-Type to application/json on all requests and JSON-stringify request bodies

### Requirement 8: Pinia Store Hydration from API

**User Story:** As a user, I want the application stores populated from the database on startup, so that I see the latest shared data.

#### Acceptance Criteria

1. THE participants Pinia_Store SHALL expose a hydrateFromData method that replaces the participants array with data from the API response
2. THE entries Pinia_Store SHALL expose a hydrateFromData method that replaces the entries array with data from the API response
3. THE scores Pinia_Store SHALL expose a hydrateFromData method that replaces the scoringEvents array with data from the API response
4. THE participants, entries, and scores Pinia_Stores SHALL remove all saveToStorage and loadFromStorage methods and all localStorage calls for shared data
5. WHEN the Pool_App starts, THE Pool_App SHALL call apiService.fetchPoolData and hydrate all stores with the response data

### Requirement 9: Remove Obsolete Stores

**User Story:** As a developer, I want unused stores removed, so that the codebase is clean and does not reference deprecated localStorage-based logic.

#### Acceptance Criteria

1. THE Pool_App SHALL remove the playerSelection Pinia_Store (functionality moved to AdminView)
2. THE Pool_App SHALL remove the playerRegistry Pinia_Store (replaced by scoring_events table)
3. THE Pool_App SHALL remove the scoringEngine Pinia_Store (scoring logic moved to Scores_API)

### Requirement 10: TeamsView (Read-Only)

**User Story:** As a pool participant, I want to see all entries and their player picks in a read-only view, so that I can see what players everyone picked.

#### Acceptance Criteria

1. THE TeamsView SHALL display all entries from the entries Pinia_Store with participant name, entry ID, and a numbered list of player names
2. THE TeamsView SHALL display the total score for each entry
3. WHEN no entries exist, THE TeamsView SHALL display an empty state message
4. THE TeamsView SHALL sort entries alphabetically by participant name
5. THE TeamsView SHALL provide no submission, editing, or deletion controls

### Requirement 11: AdminView Player Assignment

**User Story:** As a pool administrator, I want to assign players to entries from the admin console, so that player entry management is centralized in the admin interface.

#### Acceptance Criteria

1. THE AdminView SHALL include an "Assign Players to Entry" section with a participant selector, entry selector, and a textarea for 15 player names
2. WHEN the admin submits player names for an entry, THE AdminView SHALL call apiService.assignPlayers and refresh the entries store from the API
3. WHEN the admin submits fewer or more than 15 player names, THE AdminView SHALL display a validation error message
4. THE AdminView SHALL call apiService methods for all CRUD operations (createParticipant, deleteParticipant, createEntry, deleteEntry, updateScores) instead of directly mutating stores with localStorage

### Requirement 12: AdminView Scoring via API

**User Story:** As a pool administrator, I want player stats processing to go through the API, so that scores are persisted in the database and entry totals are recalculated server-side.

#### Acceptance Criteria

1. WHEN the admin processes player stats, THE AdminView SHALL parse the text input into a players array and call apiService.updateScores
2. WHEN the scoring API returns results, THE AdminView SHALL refresh all pool data from the API to reflect updated entry scores
3. IF the scoring API call fails, THEN THE AdminView SHALL display the error message to the admin

### Requirement 13: App Navigation Changes

**User Story:** As a user, I want the middle navigation tab to show "Teams" instead of "Player Selection", so that the navigation reflects the new read-only teams view.

#### Acceptance Criteria

1. THE Pool_App SHALL render the middle navigation tab with the label "Teams" instead of "Player Selection"
2. WHEN the "Teams" tab is clicked, THE Pool_App SHALL render the TeamsView component
3. THE Pool_App SHALL import TeamsView instead of PlayerSelectorView

### Requirement 14: Error Handling for API Failures

**User Story:** As a user, I want the application to handle API failures gracefully, so that the app remains usable even when the API is temporarily unavailable.

#### Acceptance Criteria

1. IF the initial fetchPoolData call fails on app startup, THEN THE Pool_App SHALL log the error and render with empty stores so the admin panel remains accessible
2. IF an admin CRUD operation fails, THEN THE AdminView SHALL display the error message to the admin without crashing the application
3. WHEN an API_Route encounters a database error, THE API_Route SHALL return an appropriate HTTP error status with a descriptive error message

### Requirement 15: Environment Configuration

**User Story:** As a developer, I want the database connection configured via environment variables, so that the app connects to local Postgres in development and Vercel Postgres in production.

#### Acceptance Criteria

1. THE API_Routes SHALL connect to Postgres using the POSTGRES_URL environment variable via the @vercel/postgres package
2. THE Pool_App SHALL document POSTGRES_URL configuration in .env.local for local development
3. WHILE running in production on Vercel, THE API_Routes SHALL use the POSTGRES_URL set in the Vercel dashboard
