# Implementation Plan: Player Popularity

## Overview

Add a "Player Popularity" section to StandingsView that aggregates all unique players across pool entries, ranks them by pick count, and displays points, team badges, and elimination status. The core logic lives in a new `usePlayerPopularity` composable; the view changes are confined to StandingsView.vue.

## Tasks

- [x] 1. Create the usePlayerPopularity composable
  - [x] 1.1 Create `src/composables/usePlayerPopularity.js` with the aggregation, scoring lookup, team resolution, and sorting logic
    - Create `src/composables/` directory
    - Implement the composable that reads from `entries`, `scores`, and `eliminatedTeams` stores
    - Iterate all entries' `playerNames` arrays, normalize to lowercase keys, store first-occurrence casing
    - Resolve each player's team code from `entry.playerTeams` (first non-null across entries)
    - Compute pick count per player
    - Look up points from scoring events (case-insensitive, default 0)
    - Determine elimination via `eliminatedTeamsStore.isTeamEliminated(teamCode)`
    - Sort: descending pickCount → descending points → ascending alphabetical name
    - Export `popularityRows` (ComputedRef) and `totalEntries` (ComputedRef)
    - Handle edge cases: missing `playerNames`, missing `playerTeams`, empty stores
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.2, 5.1, 8.1, 8.2_

  - [ ]* 1.2 Write property test: Aggregation produces exactly one row per unique player (Property 1)
    - **Property 1: Aggregation produces exactly one row per unique player with first-occurrence casing**
    - Generate random entries with varied player name casings and overlaps
    - Assert output length equals number of case-insensitively-unique players
    - Assert displayed name matches first-occurrence casing
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 1.3 Write property test: Pick count equals entries containing that player (Property 2)
    - **Property 2: Pick count equals the number of entries containing that player**
    - For each output row, count entries whose playerNames include that player (case-insensitive)
    - Assert pickCount matches that count
    - **Validates: Requirements 2.2**

  - [ ]* 1.4 Write property test: Sort order invariant (Property 3)
    - **Property 3: Sort order invariant — descending pick count, descending points, ascending name**
    - For every consecutive pair in output, assert the sort invariant holds
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 1.5 Write property test: Points lookup correctness with zero default (Property 4)
    - **Property 4: Points lookup correctness with zero default**
    - For each output row, verify points matches the scoring event (case-insensitive) or 0
    - **Validates: Requirements 4.2**

  - [ ]* 1.6 Write property test: Elimination flag matches team elimination status (Property 5)
    - **Property 5: Elimination flag matches team elimination status**
    - For each output row, assert eliminated is true iff team is in eliminated teams list
    - **Validates: Requirements 5.1**

  - [ ]* 1.7 Write property test: Team resolution uses first non-null team code (Property 6)
    - **Property 6: Team resolution uses first non-null team code across entries**
    - Generate entries where same player has different/null team codes
    - Assert output team equals first non-null encountered in entry order
    - **Validates: Requirements 8.1, 8.2**

- [x] 2. Checkpoint - Verify composable logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Integrate the popularity section into StandingsView
  - [x] 3.1 Add the Player Popularity section template to `src/views/StandingsView.vue`
    - Import `usePlayerPopularity` composable
    - Destructure `popularityRows` and `totalEntries` in setup()
    - Add the popularity `<section>` between the standings `<table>` and the MVP card `<div>`
    - Include heading "Player Popularity" and subtitle showing total entries count
    - Render a table with columns: Player, Team, Points, Picked
    - Apply `player-eliminated` class on eliminated player names
    - Use `getTeamBadgeStyle(row.team, row.eliminated)` for team badges
    - Format picked column as "Picked by N/M entries"
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

  - [x] 3.2 Add empty state handling to the popularity section
    - Show "No entries yet" when entries store is empty
    - Show "No players assigned yet" when entries exist but popularityRows is empty
    - _Requirements: 6.1, 6.2_

  - [x] 3.3 Add responsive styles for the popularity section
    - Style the table using existing CSS custom properties (--bg-card, --text-heading, --border-color, etc.)
    - Add media query for ≤768px: shorten "Picked by N/M entries" to "N/M" or hide non-essential columns
    - Reuse existing patterns: `.team-badge`, `.player-eliminated`, table styling conventions
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 3.4 Write unit tests for StandingsView popularity section rendering
    - Test that the "Player Popularity" heading renders when data exists
    - Test empty state messages for no entries and no players scenarios
    - Test that "Across N entries" subtitle displays correct count
    - Test that eliminated players get the `player-eliminated` class
    - _Requirements: 1.2, 1.3, 5.1, 6.1, 6.2_

- [x] 4. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The composable is independently testable without mounting Vue components
- Property tests use `fast-check` (v3.13.0, already installed)
- All styling reuses existing CSS custom properties and patterns from StandingsView
- No new stores, API endpoints, or backend changes are needed
