---
inclusion: manual
---

# Player Data Format Guide

## Overview

This document defines the standard format for player scoring data that the NHL Playoff Pool application receives and processes. This format is used for both API responses and manual data imports.

## Data Structure

Player data is provided as a table with the following columns:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| 1 | NAME | String | Player's full name (e.g., "Mats Zuccarello") |
| 2 | PTS | Integer | Total Points |

## Sample Data

```
NAME                    PTS
Mats Zuccarello         3
Kirill Kaprizov         3
Matt Boldy              3
Evgeni Malkin           2
Taylor Hall             2
Ryan Hartman            2
Joel Eriksson Ek        2
Logan Stankoven         2
Jackson Blake           2
Erik Karlsson           1
Rickard Rakell          1
Bryan Rust              1
Rasmus Ristolainen      1
Travis Sanheim          1
Christian Dvorak        1
Travis Konecny          1
Tommy Novak             1
Miro Heiskanen          1
Jason Robertson         1
Quinn Hughes            1
Trevor Zegras           1
Jamie Drysdale          1
Brock Faber             1
Wyatt Johnston          1
Denver Barkey           1
Porter Martone          1
Sidney Crosby           0
Nick Foligno            0
Kris Letang             0
Jordan Staal            0
Claude Giroux           0
```

## Format Specifications

### Name Field Format

Player names are simple strings without team codes:
- `Mats Zuccarello`
- `Kirill Kaprizov`
- `Matt Boldy`

### Points Field

Points are non-negative integers representing the player's total points.

## Data Processing Notes

### Data Validation Rules

1. **Player Name**: Must be a non-empty string
2. **Points**: Must be a non-negative integer
3. **Format**: Each line should contain NAME and PTS separated by whitespace

### Handling Edge Cases

- **Players with 0 points**: Include in the list
- **Missing data**: If any required field is missing, the record should be flagged as invalid
- **Duplicate players**: Should not occur; if found, use the most recent entry

## Integration Points

This format is used in:

1. **Admin Screen Updates**: Player names and points from this format are used to update player statistics on the admin screen of the application
2. **Manual Imports**: Admin interface accepts player data in this format
3. **Test Data**: Unit tests use this format for mock data
4. **Data Persistence**: Stored data maintains this structure

## Admin Screen Usage

The admin screen "Scoring Updates from Player Stats" section accepts player data in the simplified NAME and PTS format. This allows quick updates of player statistics without requiring full game data (position, goals, assists, etc.).

## Example Usage in Code

```javascript
// Parse player data
const playerData = {
  name: "Mats Zuccarello",
  points: 3
};

// Validate points
if (playerData.points < 0) {
  throw new Error("Points cannot be negative");
}
```

## Version History

- **v2.0** (Current): Simplified format with NAME and PTS only for admin screen updates
- **v1.0**: Initial format specification with full game data (RK, NAME, POS, GP, G, A, PTS)
