# Stevey's NHL Playoff Pool Requirements Document

## Introduction

Stevey's NHL Playoff Pool is a single-page application that enables a small group of friends to participate in a fantasy hockey pool during the NHL playoffs. Participants select 15 individual players and earn points based on their real-world performance (goals, assists, wins, shutouts). The application tracks scores in real-time, displays standings, and provides administrative controls for pool management.

## Glossary

- **Pool**: A single instance of the playoff pool with its own participants, picks, and scoring
- **Participant**: A person who has entered the pool and made player selections
- **Entry**: A single set of 15 player picks by a participant (participants may have multiple entries)
- **Pick**: A single player selected by a participant for their entry
- **Scoring Event**: A manual scoring update (goal, assist, win, shutout) that generates points
- **Standings**: The ranked list of all entries sorted by total points
- **Admin**: A user with permissions to manage the pool, including creating pools, managing participants, and updating scores
- **Manual Scoring**: Administrator-entered scoring updates that are processed to update participant scores
- **LocalStorage**: Browser-based persistent storage for all pool data (participants, entries, scores)

## Requirements

### Requirement 1: Participant Entry Management

**User Story:** As a pool administrator, I want to manage participant entries, so that I can track who is in the pool and how many entries each person has.

#### Acceptance Criteria

1. THE Admin_Console SHALL allow creation of new participants with a name, email address, and entry fee amount
2. WHEN a participant is created, THE System SHALL use the participant's email address as their unique identifier
3. THE Admin_Console SHALL allow multiple entries per participant, each with a unique entry identifier
4. WHEN an entry is created, THE System SHALL initialize it with an empty player selection list
5. THE Admin_Console SHALL display all participants and their entry count
6. THE Admin_Console SHALL allow deletion of entries (with confirmation)

### Requirement 2: Player Selection and Validation

**User Story:** As a participant, I want to select exactly 15 players for my entry, so that I can compete in the pool.

#### Acceptance Criteria

1. WHEN a participant accesses the player selection interface, THE Player_Selector SHALL display all available NHL players eligible for the current playoff season
2. THE Player_Selector SHALL allow selection of players from any position (forwards, defensemen, goalies)
3. WHEN a participant has selected fewer than 15 players, THE System SHALL prevent entry submission
4. WHEN a participant has selected exactly 15 players, THE System SHALL enable entry submission
5. WHEN a participant attempts to select more than 15 players, THE System SHALL prevent the selection and display an error message
6. WHEN a participant submits their selection, THE System SHALL save the entry with a timestamp
7. THE System SHALL prevent duplicate player selections within a single entry

### Requirement 3: Manual Score Tracking

**User Story:** As a participant, I want to see my score update as the administrator enters scoring data, so that I can track my performance throughout the playoffs.

#### Acceptance Criteria

1. WHEN an administrator enters a scoring update via the admin panel, THE Scoring_Engine SHALL process the update
2. WHEN a scoring update matches a player in an entry, THE Scoring_Engine SHALL calculate points according to the scoring rules
3. WHEN points are calculated, THE System SHALL update the entry's total score immediately
4. THE Standings_Display SHALL refresh to reflect updated scores
5. WHEN a participant views the standings, THE System SHALL display current scores reflecting all processed scoring updates

### Requirement 4: Scoring Rules Implementation

**User Story:** As a pool administrator, I want the system to correctly apply the scoring rules, so that all participants are scored fairly.

#### Acceptance Criteria

1. WHEN a player records a goal, THE Scoring_Engine SHALL award 1 point to all entries containing that player
2. WHEN a player records an assist, THE Scoring_Engine SHALL award 1 point to all entries containing that player
3. WHEN a goalie records a win, THE Scoring_Engine SHALL award 1 point to all entries containing that goalie
4. WHEN a goalie records a shutout, THE Scoring_Engine SHALL award 2 additional points (for a total of 3 points: 1 for win + 2 for shutout) to all entries containing that goalie
5. THE Scoring_Engine SHALL not double-count points for the same event
6. WHEN a scoring event is processed, THE System SHALL log the event with timestamp and affected entries

### Requirement 5: Standings and Leaderboard Display

**User Story:** As a participant, I want to view the current standings ranked by score, so that I can see how I'm performing relative to other entries.

#### Acceptance Criteria

1. THE Standings_Display SHALL show all entries ranked by total points in descending order
2. THE Standings_Display SHALL display the participant name, entry identifier, and total points for each entry
3. WHEN entries have equal points, THE Standings_Display SHALL sort by entry creation timestamp (earliest first)
4. THE Standings_Display SHALL update automatically when scores change
5. THE Standings_Display SHALL be accessible from the main application view without requiring authentication

### Requirement 6: Admin Console Access and Controls

**User Story:** As a pool administrator, I want a dedicated admin console, so that I can manage the pool and update scores manually.

#### Acceptance Criteria

1. THE Admin_Console SHALL be accessible via a protected interface (password or simple authentication)
2. THE Admin_Console SHALL display all participants, entries, and their current scores
3. THE Admin_Console SHALL provide controls to manually update scores via text input
4. WHEN the Admin updates a score manually, THE System SHALL log the change with timestamp and admin identifier
5. THE Admin_Console SHALL allow export of standings data

### Requirement 7: Data Export and Sharing

**User Story:** As a pool administrator, I want to export standings data, so that I can share results with participants.

#### Acceptance Criteria

1. THE Admin_Console SHALL provide an export function that generates a CSV file containing all entries and their scores
2. WHEN export is triggered, THE System SHALL include participant names, entry identifiers, player selections, and total points
3. THE System SHALL generate a shareable standings view (read-only) that can be accessed via a unique URL
4. THE Shareable_View SHALL display current standings without requiring authentication

### Requirement 8: External API Integration

**User Story:** As a system, I want to integrate with an external NHL API, so that scoring data is automatically retrieved and processed.

#### Acceptance Criteria

1. WHEN the system starts, THE API_Client SHALL establish a connection to the External_API
2. WHEN the External_API is unavailable, THE System SHALL log the error and continue operation with manual scoring capability
3. THE API_Client SHALL poll the External_API at regular intervals (e.g., every 5 minutes) for new scoring events
4. WHEN new scoring events are retrieved, THE Scoring_Engine SHALL process them and update entry scores
5. THE System SHALL cache API responses to minimize redundant requests
6. THE System SHALL handle API rate limits gracefully

### Requirement 8: Data Persistence

**User Story:** As a user, I want all pool data to be saved, so that I don't lose information if the application is closed or restarted.

#### Acceptance Criteria

1. WHEN an entry is created or modified, THE System SHALL persist the data to localStorage
2. WHEN the application is restarted, THE System SHALL load all previously saved pool data from localStorage
3. WHEN a score is updated, THE System SHALL persist the change to localStorage immediately
4. THE System SHALL maintain data integrity across application restarts
