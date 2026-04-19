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
| 1 | RK (Rank) | Integer | Player's ranking position in the standings |
| 2 | NAME | String | Player's full name with team abbreviation (e.g., "Mats Zuccarello MIN") |
| 3 | POS | String | Position code (RW, LW, C, D) |
| 4 | GP | Integer | Games Played |
| 5 | G | Integer | Goals scored |
| 6 | A | Integer | Assists |
| 7 | PTS | Integer | Total Points (Goals + Assists) |

## Sample Data

```
RK  NAME                    POS  GP  G   A   PTS
1   Mats Zuccarello MIN     RW   1   0   3   3
2   Kirill Kaprizov MIN     LW   1   1   2   3
3   Matt Boldy MIN          LW   1   1   2   3
4   Evgeni Malkin PIT       C    1   1   1   2
5   Taylor Hall CAR         LW   1   1   1   2
6   Ryan Hartman MIN        RW   1   1   1   2
7   Joel Eriksson Ek MIN    C    1   2   0   2
8   Logan Stankoven CAR     C    1   1   1   2
9   Jackson Blake CAR       RW   1   0   2   2
10  Erik Karlsson PIT       D    1   0   1   1
11  Rickard Rakell PIT      RW   1   0   1   1
12  Bryan Rust PIT          RW   1   1   0   1
13  Rasmus Ristolainen PHI  D    1   0   1   1
14  Travis Sanheim PHI      D    1   1   0   1
15  Christian Dvorak PHI    C    1   0   1   1
16  Travis Konecny PHI      RW   1   0   1   1
17  Tommy Novak PIT         C    1   0   1   1
18  Miro Heiskanen DAL      D    1   1   0   1
19  Jason Robertson DAL     LW   1   1   0   1
20  Quinn Hughes MIN        D    1   0   1   1
21  Trevor Zegras PHI       C    1   0   1   1
22  Jamie Drysdale PHI      D    1   1   0   1
23  Brock Faber MIN         D    1   0   1   1
24  Wyatt Johnston DAL      C    1   0   1   1
25  Denver Barkey PHI       C    1   0   1   1
26  Porter Martone PHI      RW   1   1   0   1
27  Sidney Crosby PIT       C    1   0   0   0
28  Nick Foligno MIN        LW   1   0   0   0
29  Kris Letang PIT         D    1   0   0   0
30  Jordan Staal CAR        C    1   0   0   0
31  Claude Giroux OTT       RW   1   0   0   0
32  Lars Eller OTT          C    1   0   0   0
33  Jamie Benn DAL          LW   1   0   0   0
34  Zach Bogosian MIN       D    1   0   0   0
35  Tyler Myers DAL         D    1   0   0   0
36  Jared Spurgeon MIN      D    1   0   0   0
37  Matt Duchene DAL        C    1   0   0   0
38  Marcus Foligno MIN      LW   1   0   0   0
39  Marcus Johansson MIN    RW   1   0   0   0
40  Vladimir Tarasenko MIN  C    1   0   0   0
41  Luke Glendening PHI     D    1   0   0   0
42  Jonas Brodin MIN        D    1   0   0   0
43  Sean Couturier PHI      C    1   0   0   0
44  Nick Cousins OTT        D    1   0   0   0
```

## Format Specifications

### Name Field Format

Player names follow the pattern: `{FirstName} {LastName} {TEAM_CODE}`

- **FirstName**: Player's first name
- **LastName**: Player's last name (may include suffixes like "Jr.", "Sr.")
- **TEAM_CODE**: Three-letter NHL team abbreviation (e.g., MIN, PIT, PHI, DAL, CAR, OTT)

**Examples:**
- `Mats Zuccarello MIN`
- `Joel Eriksson Ek MIN`
- `Evgeni Malkin PIT`

### Position Codes

Valid position codes:
- `RW` - Right Wing
- `LW` - Left Wing
- `C` - Center
- `D` - Defenseman

### Ranking

- Rank is determined by total points (PTS column)
- Players with equal points maintain their relative order from the source data
- Rank starts at 1 for the highest-scoring player

## Data Processing Notes

### Scoring Calculation

Points are calculated as: **PTS = G + A**

The application should validate that the PTS column equals the sum of G and A columns.

### Data Validation Rules

1. **Rank Continuity**: Ranks should be sequential integers starting from 1
2. **Points Ordering**: Players should be ordered by points in descending order
3. **Non-negative Values**: All numeric fields (GP, G, A, PTS) must be non-negative
4. **Team Code Validation**: Team codes must be valid NHL team abbreviations
5. **Position Validation**: Position codes must be one of: RW, LW, C, D
6. **Name Format**: Names must include both first and last name plus team code

### Handling Edge Cases

- **Players with 0 points**: Include in the list, ranked after all players with points
- **Tied players**: Maintain order from source data; do not re-rank
- **Missing data**: If any required field is missing, the record should be flagged as invalid
- **Duplicate players**: Should not occur; if found, use the most recent entry

## Integration Points

This format is used in:

1. **API Responses**: NHL API proxy returns data in this format
2. **Manual Imports**: Admin interface accepts CSV/table data in this format
3. **Admin Screen Updates**: Player names and points from this format are used to update player statistics on the admin screen of the application
4. **Test Data**: Unit tests use this format for mock data
5. **Data Persistence**: Stored data maintains this structure

## Admin Screen Usage

The player names and points extracted from this format are used to update player statistics on the admin screen. The admin interface allows manual entry or import of player performance data (name and points) which is then processed and stored to update the application's player statistics and standings.

## Example Usage in Code

```javascript
// Parse player data
const playerData = {
  rank: 1,
  name: "Mats Zuccarello",
  team: "MIN",
  position: "RW",
  gamesPlayed: 1,
  goals: 0,
  assists: 3,
  points: 3
};

// Validate points calculation
if (playerData.points !== playerData.goals + playerData.assists) {
  throw new Error("Points calculation mismatch");
}
```

## Version History

- **v1.0** (Current): Initial format specification based on NHL playoff pool scoring data
