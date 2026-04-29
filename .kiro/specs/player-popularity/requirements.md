# Requirements Document

## Introduction

A "Player Popularity" section within the Standings view of the NHL Playoff Pool application that shows every unique player across all entries, sorted by how many entries drafted them. The section surfaces "chalk" picks (widely selected players) versus "sleepers" (rarely picked players), along with each player's current points, team badge, and elimination status. All data is already available from the existing pool-data API and Pinia stores — no new backend work is required.

## Glossary

- **Popularity_Section**: A new section within StandingsView that displays players ranked by draft popularity across all pool entries
- **Player_Row**: A single row in the Popularity_Section representing one unique player and their aggregated data
- **Entry**: A pool participant's submission containing 15 selected NHL players, stored in the entries Pinia store
- **Pick_Count**: The number of entries that include a given player in their roster
- **Total_Entries**: The total number of entries in the pool
- **Scoring_Event**: A record in the scores store mapping a player name to their current playoff points
- **Team_Badge**: A styled inline element showing a player's NHL team abbreviation with official team colors from teamColors.js
- **Eliminated_Team**: An NHL team that has been knocked out of the playoffs, tracked in the eliminatedTeams store
- **Standings_View**: The existing StandingsView.vue component that displays rankings, player stats, and will now include the Popularity_Section

## Requirements

### Requirement 1: Section Placement

**User Story:** As a pool participant, I want to see player popularity data on the Standings page, so that I can view it alongside the rankings without switching tabs.

#### Acceptance Criteria

1. THE Standings_View SHALL include a Popularity_Section positioned immediately after the standings table and before the MVP Player card
2. THE Popularity_Section SHALL have a heading of "Player Popularity"
3. THE Popularity_Section SHALL display the Total_Entries count in a subtitle so users can interpret Pick_Count in context

### Requirement 2: Player Aggregation

**User Story:** As a pool participant, I want to see every unique player across all entries in one list, so that I can understand the full player landscape of the pool.

#### Acceptance Criteria

1. THE Popularity_Section SHALL display one Player_Row for each unique player name found across all entries
2. THE Popularity_Section SHALL compute the Pick_Count for each player by counting the number of entries whose playerNames array includes that player (case-insensitive matching)
3. THE Popularity_Section SHALL display the Total_Entries count so users can interpret Pick_Count in context
4. WHEN two entries contain the same player name differing only in letter casing, THE Popularity_Section SHALL treat them as the same player and display the original casing from the first occurrence

### Requirement 3: Sorting by Popularity

**User Story:** As a pool participant, I want players sorted by how many entries picked them, so that I can quickly identify the most and least popular picks.

#### Acceptance Criteria

1. THE Popularity_Section SHALL sort players in descending order by Pick_Count
2. WHEN two players have the same Pick_Count, THE Popularity_Section SHALL sort them in descending order by points
3. WHEN two players have the same Pick_Count and the same points, THE Popularity_Section SHALL sort them in ascending alphabetical order by player name

### Requirement 4: Player Data Display

**User Story:** As a pool participant, I want to see each player's points, team, and pick count, so that I can evaluate popular picks versus sleepers.

#### Acceptance Criteria

1. Each Player_Row SHALL display the player name
2. Each Player_Row SHALL display the player's current points from the scores store (defaulting to 0 when no Scoring_Event exists)
3. Each Player_Row SHALL display a Team_Badge showing the player's NHL team abbreviation styled with official team colors from teamColors.js
4. Each Player_Row SHALL display the Pick_Count formatted as "Picked by N/M entries" where N is the Pick_Count and M is the Total_Entries

### Requirement 5: Eliminated Player Indication

**User Story:** As a pool participant, I want to see which popular players are on eliminated teams, so that I can assess how elimination impacts the pool.

#### Acceptance Criteria

1. WHEN a player's team is in the eliminated teams list, THE Player_Row SHALL apply a strikethrough style and reduced opacity to the player name
2. WHEN a player's team is in the eliminated teams list, THE Team_Badge SHALL display with a grey background and muted text color consistent with the existing getTeamBadgeStyle behavior

### Requirement 6: Empty and Loading States

**User Story:** As a pool participant, I want clear feedback when no data is available, so that I understand the current state of the view.

#### Acceptance Criteria

1. WHEN no entries exist in the entries store, THE Popularity_Section SHALL display an empty state message indicating no entries are available
2. WHEN entries exist but no players have been assigned to any entry, THE Popularity_Section SHALL display an empty state message indicating no players are available

### Requirement 7: Responsive Layout

**User Story:** As a pool participant, I want the Popularity view to work on both desktop and mobile devices, so that I can check popularity from any device.

#### Acceptance Criteria

1. THE Popularity_Section SHALL display player data in a table layout on viewports wider than 768px
2. THE Popularity_Section SHALL adapt the layout for viewports 768px or narrower by hiding non-essential columns or switching to a card-based layout consistent with the existing mobile patterns in the application
3. THE Popularity_Section SHALL use the application's existing CSS custom properties for colors, fonts, and spacing

### Requirement 8: Player Team Resolution

**User Story:** As a pool participant, I want to see the correct team for every player even if they appear in multiple entries, so that team badges are always accurate.

#### Acceptance Criteria

1. THE Popularity_Section SHALL resolve each player's team code by looking up the playerTeams map from any entry that contains that player
2. WHEN a player appears in multiple entries, THE Popularity_Section SHALL use the first non-null team code found across entries for that player
