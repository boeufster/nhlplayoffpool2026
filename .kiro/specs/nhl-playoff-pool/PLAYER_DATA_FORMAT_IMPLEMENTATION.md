# Player Data Format Implementation

## Overview

Successfully implemented the standardized player data format (RK, NAME, POS, GP, G, A, PTS) throughout the NHL Playoff Pool application. This format is now used for admin screen updates and player statistics tracking.

## Changes Made

### 1. Updated Documentation
- **File**: `.kiro/steering/PLAYER_DATA_FORMAT.md`
- **Changes**: Added section explaining that player names and points from this format are used to update player statistics on the admin screen of the application

### 2. Created Player Registry Store
- **File**: `src/stores/playerRegistry.js`
- **Purpose**: Centralized management of player data using the standardized format
- **Key Features**:
  - Add or update players with validation
  - Import multiple players with error handling
  - Retrieve players by name and team
  - Sort players by points
  - Persist to localStorage
  - Track last updated timestamp

### 3. Updated Admin View
- **File**: `src/views/AdminView.vue`
- **Changes**:
  - Imported `usePlayerRegistryStore`
  - Implemented missing `importPlayerData()` function
  - Integrated player registry into data import workflow
  - Validates data against standardized format
  - Stores imported players in registry

### 4. Added Comprehensive Tests
- **File**: `src/stores/__tests__/playerRegistry.test.js`
- **Coverage**: 12 test cases covering:
  - Adding new players
  - Updating existing players
  - Points calculation validation
  - Position code validation
  - Batch imports with error handling
  - Player retrieval and sorting
  - Data persistence
  - Timestamp tracking

## Data Format Specification

The standardized format uses these columns:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| 1 | RK | Integer | Player's ranking position |
| 2 | NAME | String | Player's full name with team code (e.g., "Mats Zuccarello MIN") |
| 3 | POS | String | Position code (RW, LW, C, D) |
| 4 | GP | Integer | Games Played |
| 5 | G | Integer | Goals scored |
| 6 | A | Integer | Assists |
| 7 | PTS | Integer | Total Points (Goals + Assists) |

## Validation Rules

The implementation enforces:
- ✓ Points calculation: PTS = G + A
- ✓ Position codes: RW, LW, C, D only
- ✓ Non-negative numeric values
- ✓ Required fields: name, team, position
- ✓ Unique player identification by name + team

## Admin Screen Integration

The admin screen now has two sections for player data:

1. **Scoring Updates from Player Stats**
   - Processes player stats and logs them
   - Validates format and calculations
   - Displays results with success/failure status

2. **Player Data Import**
   - Imports player data into the registry
   - Validates all fields
   - Stores players for future reference
   - Supports both pipe-separated and whitespace-separated formats

## Storage

Player data is persisted to localStorage under the key `playerRegistry` with structure:
```javascript
{
  players: [
    {
      name: "Mats Zuccarello",
      team: "MIN",
      position: "RW",
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3,
      fullName: "Mats Zuccarello MIN",
      updatedAt: "2026-04-19T..."
    }
  ],
  lastUpdated: "2026-04-19T..."
}
```

## Test Results

All 194 tests pass, including:
- 12 new player registry tests
- All existing store and view tests
- Full integration with admin view

## Usage Example

```javascript
// Import players from standardized format
const playerData = [
  {
    name: "Mats Zuccarello",
    team: "MIN",
    position: "RW",
    gamesPlayed: 1,
    goals: 0,
    assists: 3,
    points: 3
  }
]

const results = playerRegistryStore.importPlayers(playerData)
// results: [{ success: true, playerName: "Mats Zuccarello", team: "MIN" }]

// Retrieve players
const player = playerRegistryStore.getPlayer("Mats Zuccarello", "MIN")
const allPlayers = playerRegistryStore.getAllPlayers()
const sorted = playerRegistryStore.getPlayersByPoints()
```

## Next Steps

The player registry is now ready for:
1. Matching player stats to entry selections
2. Calculating scores based on player performance
3. Tracking player statistics over time
4. Generating reports on player performance
