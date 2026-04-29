# Requirements Document

## Introduction

A "Head-to-Head" comparison section within the Standings view of the NHL Playoff Pool application that lets users pick two entries and see a detailed side-by-side breakdown. The comparison surfaces shared players, unique players per entry, who is winning at each position, total scores, and a points breakdown between active and eliminated players. All data is already available from the existing pool-data API and Pinia stores — no new backend work is required.

## Glossary

- **Head_to_Head_Section**: A new section within TeamsView that displays a side-by-side comparison of two selected entries
- **Entry**: A pool participant's submission containing 15 selected NHL players, stored in the entries Pinia store with playerNames, playerTeams, and computed scores
- **Entry_Selector**: A pair of dropdown controls that allow the user to pick two entries for comparison
- **Comparison_Panel**: The side-by-side display area that renders after two distinct entries are selected
- **Shared_Player**: A player whose name appears in the playerNames array of both selected entries (matched case-insensitively)
- **Unique_Player**: A player whose name appears in the playerNames array of only one of the two selected entries
- **Active_Player**: A player whose team is not in the eliminated teams list
- **Eliminated_Player**: A player whose team is in the eliminated teams list tracked by the eliminatedTeams store
- **Points_Breakdown**: A summary showing how many points each entry earns from Active_Players versus Eliminated_Players
- **Scoring_Event**: A record in the scores store mapping a player name to their current playoff points
- **Team_Badge**: A styled inline element showing a player's NHL team abbreviation with official team colors from teamColors.js
- **Standings_View**: The existing StandingsView.vue component that displays rankings, player stats, and other pool sections
- **Teams_View**: The existing TeamsView.vue component that displays entry rosters and player overlap

## Requirements

### Requirement 1: Section Placement and Heading

**User Story:** As a pool participant, I want to access the head-to-head comparison from the Teams page, so that I can compare entries alongside the roster and overlap views.

#### Acceptance Criteria

1. THE Teams_View SHALL include a Head_to_Head_Section positioned before the Player Overlap section
2. THE Head_to_Head_Section SHALL have a heading of "Head-to-Head"

### Requirement 2: Entry Selection

**User Story:** As a pool participant, I want to pick any two entries to compare, so that I can see how my roster stacks up against another participant.

#### Acceptance Criteria

1. THE Head_to_Head_Section SHALL display two Entry_Selector dropdown controls, each listing all entries by participantName
2. THE Entry_Selector dropdowns SHALL each include a default placeholder option prompting the user to select an entry
3. WHEN the user selects the same entry in both dropdowns, THE Head_to_Head_Section SHALL display a message indicating two different entries must be selected
4. WHEN two distinct entries are selected, THE Head_to_Head_Section SHALL display the Comparison_Panel
5. WHEN fewer than two entries exist in the entries store, THE Head_to_Head_Section SHALL display a message indicating that at least two entries are required for comparison

### Requirement 3: Score Summary

**User Story:** As a pool participant, I want to see each entry's total score side by side, so that I can immediately tell who is ahead.

#### Acceptance Criteria

1. THE Comparison_Panel SHALL display each selected entry's participantName as a column header
2. THE Comparison_Panel SHALL display each selected entry's total score computed by summing the points of all players in that entry's playerNames array
3. THE Comparison_Panel SHALL visually highlight the entry with the higher total score
4. WHEN both entries have the same total score, THE Comparison_Panel SHALL display both scores without highlighting either one

### Requirement 4: Shared Players Display

**User Story:** As a pool participant, I want to see which players both entries have in common, so that I can understand where our rosters overlap.

#### Acceptance Criteria

1. THE Comparison_Panel SHALL display a "Shared Players" subsection listing every Shared_Player found in both selected entries
2. Each Shared_Player row SHALL display the player name, a Team_Badge styled with official team colors, and the player's current points from the scores store (defaulting to 0 when no Scoring_Event exists)
3. WHEN a Shared_Player's team is in the eliminated teams list, THE row SHALL apply a strikethrough style and reduced opacity to the player name and display the Team_Badge with grey styling consistent with getTeamBadgeStyle
4. WHEN no shared players exist between the two entries, THE "Shared Players" subsection SHALL display a message indicating no players are shared
5. THE "Shared Players" subsection SHALL sort players in descending order by points

### Requirement 5: Unique Players Display

**User Story:** As a pool participant, I want to see which players are unique to each entry, so that I can identify the roster differences driving the score gap.

#### Acceptance Criteria

1. THE Comparison_Panel SHALL display a "Unique Players" subsection with two columns, one for each selected entry
2. Each column SHALL list only the Unique_Players belonging to that entry
3. Each Unique_Player row SHALL display the player name, a Team_Badge styled with official team colors, and the player's current points from the scores store (defaulting to 0 when no Scoring_Event exists)
4. WHEN a Unique_Player's team is in the eliminated teams list, THE row SHALL apply a strikethrough style and reduced opacity to the player name and display the Team_Badge with grey styling consistent with getTeamBadgeStyle
5. Each column SHALL sort unique players in descending order by points
6. Each column SHALL display a subtotal of points from its Unique_Players

### Requirement 6: Points Breakdown by Elimination Status

**User Story:** As a pool participant, I want to see how many points come from active versus eliminated players for each entry, so that I can gauge future scoring potential.

#### Acceptance Criteria

1. THE Comparison_Panel SHALL display a "Points Breakdown" subsection for each selected entry
2. THE Points_Breakdown SHALL show the total points earned from Active_Players for each entry
3. THE Points_Breakdown SHALL show the total points earned from Eliminated_Players for each entry
4. THE Points_Breakdown SHALL show the count of Active_Players and Eliminated_Players for each entry
5. THE Points_Breakdown SHALL visually distinguish active points from eliminated points using color or styling consistent with the application's existing eliminated player treatment

### Requirement 7: Eliminated Player Indication

**User Story:** As a pool participant, I want eliminated players clearly marked in the comparison, so that I can see at a glance which picks are no longer scoring.

#### Acceptance Criteria

1. WHEN a player's team is in the eliminated teams list, THE player name SHALL be displayed with a strikethrough style and reduced opacity
2. WHEN a player's team is in the eliminated teams list, THE Team_Badge SHALL display with a grey background and muted text color consistent with the existing getTeamBadgeStyle behavior
3. WHEN a player has no team code resolved from any entry, THE player SHALL be treated as an Active_Player

### Requirement 8: Player Team Resolution

**User Story:** As a pool participant, I want to see the correct team for every player in the comparison, so that team badges and elimination status are accurate.

#### Acceptance Criteria

1. THE Head_to_Head_Section SHALL resolve each player's team code by looking up the playerTeams map from the entry that contains that player
2. WHEN a Shared_Player appears in both entries with different team codes, THE Head_to_Head_Section SHALL use the first non-null team code found

### Requirement 9: Responsive Layout

**User Story:** As a pool participant, I want the head-to-head comparison to work on both desktop and mobile devices, so that I can compare entries from any device.

#### Acceptance Criteria

1. THE Head_to_Head_Section SHALL display the Comparison_Panel in a side-by-side column layout on viewports wider than 768px
2. THE Head_to_Head_Section SHALL adapt the layout for viewports 768px or narrower by stacking columns vertically or switching to a compact layout consistent with the existing mobile patterns in the application
3. THE Head_to_Head_Section SHALL use the application's existing CSS custom properties for colors, fonts, and spacing

### Requirement 10: Empty and Edge States

**User Story:** As a pool participant, I want clear feedback when data is missing or incomplete, so that I understand the current state of the comparison.

#### Acceptance Criteria

1. WHEN no entries exist in the entries store, THE Head_to_Head_Section SHALL display an empty state message indicating no entries are available
2. WHEN a selected entry has no players assigned (empty playerNames array), THE Comparison_Panel SHALL display that entry's column with a message indicating no players are assigned
3. WHEN neither selected entry has any players with scoring events, THE Comparison_Panel SHALL display both entries with 0 total scores and 0 points for all players
