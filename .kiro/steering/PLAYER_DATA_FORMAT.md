---
inclusion: manual
---

# Player Data Format Guide

## Overview

This document defines the standard formats for player and goalie scoring data that the NHL Playoff Pool application receives and processes. These formats are used for admin screen data entry.

## Player Stats Format

| Column | Name | Type | Description |
|--------|------|------|-------------|
| 1 | NAME | String | Player's full name |
| 2 | TEAM | String | 2-4 uppercase letter NHL team code |
| 3 | PTS | Integer | Total Points |

### Example

```
Connor McDavid EDM 2
Kirill Kaprizov MIN 3
Matt Boldy MIN 3
Leon Draisaitl EDM 7
Taylor Hall CAR 7
```

The parser splits on whitespace, takes the last token as points (number), the second-to-last as team code (if it matches 2-4 uppercase letters), and everything before as the player name.

## Goalie Stats Format

| Column | Name | Type | Description |
|--------|------|------|-------------|
| 1 | NAME | String | Goalie's full name |
| 2 | TEAM | String | 2-4 uppercase letter NHL team code |
| 3 | WINS | Integer | Number of wins |
| 4 | SHUTOUTS | Integer | Number of shutouts |

Scoring: 1 point per win + 2 extra points per shutout.

### Example

```
Scott Wedgewood COL 4 1
Jesper Wallstedt MIN 1 0
Dan Vladar CGY 1 0
```

## Player Assignment Format

When assigning 15 players to an entry, each line is one player with an optional team code:

```
Connor McDavid EDM
Cale Makar COL
Sidney Crosby PIT
```

The team code is parsed from the last token if it matches 2-4 uppercase letters. Players without a team code are stored with `team = null`.

## Team Code

A 2-4 uppercase letter NHL team abbreviation (e.g. EDM, TOR, MTL, MIN, COL). The team code is:
- Stored in `entry_players.team` and `scoring_events.team`
- Used to display team badges with official NHL colors
- Used to determine elimination status

## Data Processing Notes

- **Team code stripping**: The parser (`parsePlayerNameAndTeam`) removes the team code from the player name before storing, so scoring matches work correctly
- **Team backfill**: When stats are processed with a team code, `entry_players.team` is backfilled for matching players that don't have one yet
- **Case-insensitive matching**: Player name matching for scoring is case-insensitive
- **Duplicate handling**: Processing stats for a player replaces their previous scoring event

## Version History

- **v3.0** (Current): Added team code to player stats, goalie stats, and player assignment formats
- **v2.0**: Simplified format with NAME and PTS only
- **v1.0**: Initial format with full game data (RK, NAME, POS, GP, G, A, PTS)
