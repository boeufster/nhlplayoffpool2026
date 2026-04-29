# Implementation Plan: Head-to-Head Comparison

## Overview

Implement a head-to-head comparison section in TeamsView.vue that lets users select two entries and see a detailed side-by-side breakdown. All logic lives in a new `useHeadToHead` composable that reads from existing Pinia stores. The section is placed before the Player Overlap section in TeamsView.

## Tasks

- [x] 1. Create the useHeadToHead composable
  - [x] 1.1 Implement core composable with entry resolution and score computation
    - Create `src/composables/useHeadToHead.js`
    - Accept two `ref` entry IDs as parameters
    - Import and read from `entries`, `scores`, and `eliminatedTeams` stores
    - Compute `entryA` / `entryB` by looking up entries by ID
    - Build a points map from `scoringEvents` (lowercase player name → points)
    - Compute `scoreA` / `scoreB` by summing points for all players in each entry's `playerNames` array (default 0 for missing)
    - Compute `isSameEntry` and `isReady` flags
    - _Requirements: 3.2, 10.3, 2.3, 2.4_

  - [x] 1.2 Implement player partitioning into shared and unique sets
    - Build lowercase player name sets for each entry
    - Compute `sharedPlayers` as the case-insensitive intersection
    - Compute `uniquePlayersA` and `uniquePlayersB` as set differences
    - For each player, resolve team from entry's `playerTeams` map (for shared players, use first non-null from entry A then entry B)
    - Determine `eliminated` flag via `isTeamEliminated(teamCode)` — null team → false
    - Sort all arrays by points descending
    - Compute `uniqueSubtotalA` and `uniqueSubtotalB` as sum of unique player points
    - _Requirements: 4.1, 4.5, 5.2, 5.5, 5.6, 7.3, 8.1, 8.2_

  - [x] 1.3 Implement points breakdown by elimination status
    - For each entry, partition players into active vs eliminated
    - Compute `breakdownA` / `breakdownB` with `activePoints`, `eliminatedPoints`, `activeCount`, `eliminatedCount`
    - Ensure `activePoints + eliminatedPoints` equals total score and `activeCount + eliminatedCount` equals total player count
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ]* 1.4 Write property test: Score computation equals sum of player points
    - **Property 1: Score computation equals sum of player points**
    - **Validates: Requirements 3.2, 10.3**
    - Create `src/composables/__tests__/useHeadToHead.test.js`
    - Use fast-check to generate random entries, playerNames, scoring events
    - Verify scoreA/scoreB equals sum of looked-up points for each entry's players

  - [ ]* 1.5 Write property test: Player partitioning is complete and disjoint
    - **Property 2: Player partitioning into shared and unique is complete and disjoint**
    - **Validates: Requirements 4.1, 5.2**
    - Verify union of shared + uniqueA + uniqueB equals union of all players across both entries
    - Verify no player appears in more than one category

  - [ ]* 1.6 Write property test: Elimination flag matches team elimination status
    - **Property 3: Elimination flag matches team elimination status**
    - **Validates: Requirements 4.3, 5.4, 7.1, 7.3**
    - Verify eliminated flag is true iff player's team is in eliminated list
    - Verify players with null team always have eliminated = false

  - [ ]* 1.7 Write property test: All player arrays are sorted by points descending
    - **Property 4: All player arrays are sorted by points descending**
    - **Validates: Requirements 4.5, 5.5**
    - Verify sharedPlayers, uniquePlayersA, uniquePlayersB are each sorted descending by points

  - [ ]* 1.8 Write property test: Unique player subtotals equal sum of unique player points
    - **Property 5: Unique player subtotals equal sum of unique player points**
    - **Validates: Requirements 5.6**
    - Verify uniqueSubtotalA equals sum of points in uniquePlayersA array
    - Verify uniqueSubtotalB equals sum of points in uniquePlayersB array

  - [ ]* 1.9 Write property test: Points breakdown partitions entry players into active and eliminated
    - **Property 6: Points breakdown partitions entry players into active and eliminated**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Verify activePoints + eliminatedPoints equals total score
    - Verify activeCount + eliminatedCount equals total player count

  - [ ]* 1.10 Write property test: Team resolution uses entry playerTeams with first-non-null for shared players
    - **Property 7: Team resolution uses entry playerTeams with first-non-null for shared players**
    - **Validates: Requirements 8.1, 8.2**
    - Verify unique players get team from their own entry's playerTeams
    - Verify shared players get first non-null team code from entry A then entry B

- [x] 2. Checkpoint - Ensure composable tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Integrate Head-to-Head section into TeamsView.vue
  - [x] 3.1 Add entry selectors and section heading
    - Import `useHeadToHead` composable and `ref` in TeamsView.vue
    - Import `getTeamBadgeStyle` from `../utils/teamColors` (already imported, verify)
    - Add two `ref('')` values for `selectedEntryIdA` and `selectedEntryIdB`
    - Destructure all composable return values in `setup()`
    - Add a new `<section class="head-to-head-section">` block BEFORE the Player Overlap section
    - Add `<h3>Head-to-Head</h3>` heading
    - Add two `<select>` dropdowns with `v-model` bindings, listing all entries by participantName
    - Each dropdown has a disabled placeholder option "Select entry…"
    - Add "vs" label between dropdowns
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 3.2 Add validation messages and empty states
    - Show "At least two entries are required for comparison" when `entries.length < 2`
    - Show "Please select two different entries to compare" when `isSameEntry` is true
    - Show "No entries are available" when entries store is empty (covered by existing empty state or dedicated message)
    - _Requirements: 2.3, 2.5, 10.1_

  - [x] 3.3 Implement score summary display
    - Display participant names as column headers
    - Display total scores for each entry
    - Apply `h2h-winner` CSS class to the entry with the higher score
    - When scores are tied, apply no highlight to either
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.4 Implement shared players subsection
    - Display "Shared Players" heading
    - List each shared player with name, team badge (using `getTeamBadgeStyle`), and points
    - Apply `player-eliminated` class (strikethrough + reduced opacity) to eliminated players
    - Apply grey badge styling for eliminated players via `getTeamBadgeStyle(teamCode, true)`
    - Show "No shared players" message when array is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.5 Implement unique players subsection
    - Display "Unique Players" heading with two side-by-side columns
    - Each column lists unique players for that entry with name, team badge, and points
    - Apply eliminated styling to eliminated players
    - Display subtotal row for each column
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 3.6 Implement points breakdown subsection
    - Display "Points Breakdown" heading
    - For each entry show active player count and total active points
    - For each entry show eliminated player count and total eliminated points
    - Use green/muted styling consistent with existing eliminated player treatment
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.7 Add empty player state handling
    - When a selected entry has empty `playerNames`, show "No players assigned" in that entry's column
    - When neither entry has scoring events, display 0 scores throughout
    - _Requirements: 10.2, 10.3_

- [x] 4. Add responsive styles and CSS
  - [x] 4.1 Add desktop and mobile styles for the head-to-head section
    - Add scoped CSS for `.head-to-head-section`, selectors, comparison panel, tables
    - Use existing CSS custom properties (--bg-card, --text-heading, --border-color, etc.)
    - On viewports > 768px: side-by-side column layout for unique players and breakdown
    - On viewports ≤ 768px: stack selectors vertically, stack unique player columns, reduce padding
    - Reuse `.player-eliminated` and `.team-badge` styles already defined in TeamsView
    - _Requirements: 9.1, 9.2, 9.3, 7.1, 7.2_

- [ ] 5. Add unit tests for TeamsView head-to-head integration
  - [ ]* 5.1 Write unit tests for section placement and UI states
    - Add tests to `src/views/__tests__/TeamsView.test.js`
    - Test that composable returns correct data for known entry inputs
    - Test isSameEntry flag when both IDs match
    - Test isReady flag when two distinct entries are selected
    - Test empty state when no entries exist
    - _Requirements: 1.1, 2.3, 2.4, 2.5, 10.1_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The composable follows the same pattern as `usePlayerPopularity.js`
- `getTeamBadgeStyle` is already imported in TeamsView — verify during implementation
- fast-check is already installed (v3.13.0)
- All data comes from existing Pinia stores — no backend changes needed
