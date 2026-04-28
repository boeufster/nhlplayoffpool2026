# Requirements Document

## Introduction

This feature adds team elimination tracking to the NHL playoff pool application. Players are associated with NHL teams via a team code suffix in the player name input (e.g. "Connor McDavid EDM"). An admin can mark teams as eliminated from the playoffs. Players on eliminated teams receive a visual indicator in the UI (strikethrough, muted styling). Elimination is visual only — existing points are preserved, and scoring logic is unaffected.

## Glossary

- **Pool_App**: The NHL Playoff Pool web application (Vue.js frontend + Vercel serverless API + PostgreSQL)
- **Admin**: An authenticated user of the Admin Console who manages pool data
- **Parser**: The `parsePlayerNameAndTeam` function that extracts a player name and optional team code from a raw input string
- **Eliminated_Teams_Store**: The Pinia store (`useEliminatedTeamsStore`) that holds the list of eliminated team codes on the client
- **Eliminated_Teams_API**: The `/api/eliminated-teams` serverless endpoint for reading and writing eliminated teams
- **Pool_Data_API**: The `/api/pool-data` serverless endpoint that returns all pool data including eliminated teams
- **Assign_Players_API**: The `/api/assign-players` serverless endpoint that assigns players to an entry
- **Teams_View**: The Teams page UI component that displays entry rosters with player details
- **Standings_View**: The Standings page UI component that displays rankings and player stats
- **Team_Code**: A 2-to-4 uppercase letter abbreviation identifying an NHL team (e.g. "EDM", "TOR", "MTL")

## Requirements

### Requirement 1: Parse Player Name and Team Code

**User Story:** As an admin, I want to enter player names with a team code suffix (e.g. "Connor McDavid EDM"), so that each player is associated with their NHL team without changing the input format significantly.

#### Acceptance Criteria

1. WHEN a raw player string ends with a space-separated token of 2 to 4 uppercase letters, THE Parser SHALL extract that token as the Team_Code and return the remaining string as the player name
2. WHEN a raw player string does not end with a valid Team_Code token, THE Parser SHALL return the entire trimmed string as the player name and null as the team
3. WHEN a raw player string contains only one token, THE Parser SHALL return that token as the player name and null as the team
4. THE Parser SHALL trim leading and trailing whitespace from the raw input before processing
5. THE Parser SHALL produce a non-empty player name for any non-empty input string

### Requirement 2: Store Team Data with Players

**User Story:** As an admin, I want the team code to be stored alongside each player in the database, so that the system can determine which team each player belongs to.

#### Acceptance Criteria

1. WHEN the Assign_Players_API receives player names with team code suffixes, THE Assign_Players_API SHALL parse each name using the Parser and store the clean player name and team code separately in the database
2. WHEN a player name has no team code suffix, THE Assign_Players_API SHALL store null as the team value for that player
3. THE Assign_Players_API SHALL store the clean player name (without team suffix) in the `player_name` column to preserve scoring match compatibility
4. THE Assign_Players_API SHALL preserve the position ordering of all 15 players in the entry

### Requirement 3: Manage Eliminated Teams

**User Story:** As an admin, I want to mark NHL teams as eliminated from the playoffs, so that the pool reflects which teams are still active.

#### Acceptance Criteria

1. WHEN an admin submits a list of eliminated team codes via POST, THE Eliminated_Teams_API SHALL replace the entire set of eliminated teams in the database with the submitted list
2. WHEN the Eliminated_Teams_API receives a GET request, THE Eliminated_Teams_API SHALL return the current list of eliminated team codes
3. WHEN the submitted list contains a team code that does not match the pattern of 2 to 4 uppercase letters, THE Eliminated_Teams_API SHALL reject the request with a 400 error
4. WHEN the submitted list contains duplicate team codes, THE Eliminated_Teams_API SHALL store each code only once
5. WHEN an admin submits a new list that omits a previously eliminated team, THE Eliminated_Teams_API SHALL remove that team from the eliminated set (enabling correction of mistakes)

### Requirement 4: Admin UI for Eliminated Teams

**User Story:** As an admin, I want a section in the Admin Console to manage eliminated teams, so that I can update elimination status as the playoffs progress.

#### Acceptance Criteria

1. WHILE the admin is authenticated, THE Admin_Console SHALL display an Eliminated Teams management section
2. WHEN the admin enters team codes and submits, THE Admin_Console SHALL send the list to the Eliminated_Teams_API and update the local store on success
3. IF the Eliminated_Teams_API returns an error, THEN THE Admin_Console SHALL display the error message to the admin
4. WHEN the Admin Console loads, THE Admin_Console SHALL display the current list of eliminated teams fetched from the server

### Requirement 5: Include Eliminated Teams in Pool Data

**User Story:** As a user, I want the pool data to include eliminated team information and player team associations, so that the UI can display elimination status.

#### Acceptance Criteria

1. WHEN the Pool_Data_API is called, THE Pool_Data_API SHALL include an `eliminatedTeams` array of team code strings in the response
2. WHEN the Pool_Data_API is called, THE Pool_Data_API SHALL include the team code for each player in the entry player data
3. WHEN a player has no team code stored, THE Pool_Data_API SHALL return null as the team value for that player

### Requirement 6: Visual Indication of Eliminated Players

**User Story:** As a pool participant, I want to see which players are on eliminated teams, so that I can understand which of my players can still earn points.

#### Acceptance Criteria

1. WHEN a player's team code is present in the eliminated teams list, THE Teams_View SHALL display that player with a strikethrough style and muted opacity
2. WHEN a player's team code is present in the eliminated teams list, THE Teams_View SHALL display the team badge with an eliminated visual style
3. WHEN a player has no team code or their team is not eliminated, THE Teams_View SHALL display that player with normal styling
4. WHEN a player's team code is present in the eliminated teams list, THE Standings_View SHALL display that player with a visual eliminated indicator in the player stats table
5. THE Pool_App SHALL preserve and display the existing point totals for eliminated players without modification

### Requirement 7: Eliminated Teams Client Store

**User Story:** As a developer, I want a dedicated Pinia store for eliminated teams, so that elimination status is reactive and accessible across all UI components.

#### Acceptance Criteria

1. WHEN pool data is fetched, THE Eliminated_Teams_Store SHALL hydrate its state from the `eliminatedTeams` array in the API response
2. WHEN a team code is queried against the store, THE Eliminated_Teams_Store SHALL return true if the team is in the eliminated list and false otherwise
3. WHEN a null or undefined team code is queried, THE Eliminated_Teams_Store SHALL return false (a player without a team is never considered eliminated)

### Requirement 8: Database Schema for Eliminated Teams

**User Story:** As a developer, I want a database table to persist eliminated teams, so that elimination state survives server restarts and is shared across all clients.

#### Acceptance Criteria

1. THE Pool_App SHALL have an `eliminated_teams` table with a `team_code` primary key column and an `eliminated_at` timestamp column
2. THE Pool_App SHALL have a `team` column on the `entry_players` table to store the team code for each player
3. WHEN the `team` column is not populated for a player, THE Pool_App SHALL default the value to null for backward compatibility
