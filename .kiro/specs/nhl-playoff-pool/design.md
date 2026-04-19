# Stevey's NHL Playoff Pool - Technical Design Document

## Overview

Stevey's NHL Playoff Pool is a single-page application (SPA) that manages a fantasy hockey pool during the NHL playoffs. The system enables participants to select 15 players and earn points based on real-world NHL playoff performance. The application provides real-time score tracking, standings display, and administrative controls for pool management.

**Key Characteristics:**
- Single-page application with client-side rendering
- Real-time score updates via external NHL API integration
- Multi-entry support per participant
- Admin console for pool management and manual scoring
- Data persistence using browser storage and/or backend database
- Public standings view accessible without authentication

## Architecture

### Simplified Architecture for Small Pool

Given 6 participants, this is a lightweight single-page application with minimal backend needs:

```
┌──────────────────────────────────────────┐
│         Vue.js 3 SPA (Frontend)          │
│  - Standings Display                     │
│  - Player Selection                      │
│  - Admin Panel (password protected)      │
│  - State Management (Pinia)              │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│    Browser LocalStorage (Data)           │
│  - Participants, Entries, Scores         │
│  - Scoring Events Log                    │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│   NHL.com API (Read-Only)                │
│  - Poll every 5 minutes for scores       │
│  - No authentication required            │
└──────────────────────────────────────────┘
```

### Technology Stack (Simplified)

**Frontend Only:**
- Framework: Vue.js 3 (SPA framework)
- State Management: Pinia (Vue state management)
- HTTP Client: Axios (for NHL API calls)
- Storage: Browser LocalStorage (no backend needed)
- Build Tool: Vite (fast build and dev server)

**Hosting:**
- **Vercel (Recommended)** - Deploy static Vue.js app for free
  - Automatic Git deployments
  - Canadian edge locations
  - No backend infrastructure needed
  - Perfect for 6-person pool

**External Integration:**
- NHL.com Official API (statsapi.web.nhl.com): Free, no authentication required

### Data Flow

```
External NHL API
       ↓
   API Client (polls every 5 minutes)
       ↓
   Scoring Engine (processes events)
       ↓
   Entry Score Updates
       ↓
   Standings Recalculation
       ↓
   UI Refresh (real-time display)
```

## Components and Interfaces

### Core Components (Simplified)

#### 1. Admin Panel
**Responsibility:** Manage participants, entries, and manual scoring

**Key Features:**
- Add/remove participants (email, name, entry fee)
- Create entries for participants
- Manual score updates (if API fails)
- View all entries and current scores
- Export standings to CSV

**Interfaces:**
```
AdminPanel
├── addParticipant(email, name, entryFee)
├── removeParticipant(email)
├── createEntry(email, playerSelections)
├── removeEntry(entryId)
├── updateScoreManually(entryId, points)
└── exportToCSV()
```

#### 2. Player Selector
**Responsibility:** Allow participants to select exactly 15 players

**Key Features:**
- Display all eligible NHL players
- Filter by position (F, D, G)
- Select/deselect players
- Validate exactly 15 selected
- Submit entry with timestamp

**Interfaces:**
```
PlayerSelector
├── loadPlayers()
├── filterByPosition(position)
├── selectPlayer(playerId)
├── deselectPlayer(playerId)
├── validateSelection()
└── submitEntry()
```

#### 3. Scoring Engine
**Responsibility:** Calculate points from NHL events

**Key Features:**
- Process goals (1pt), assists (1pt), wins (1pt), shutouts (2pt bonus)
- Prevent double-counting
- Log all events
- Update entry scores

**Interfaces:**
```
ScoringEngine
├── processScoringEvent(event)
├── calculatePoints(event)
├── updateEntryScore(entryId, points)
└── getEventLog()
```

#### 4. Standings Display
**Responsibility:** Show ranked entries

**Key Features:**
- Sort by points (descending)
- Tiebreaker: earliest entry first
- Auto-refresh on score updates
- Public access (no auth needed)

**Interfaces:**
```
StandingsDisplay
├── getStandings()
├── sortByPoints()
├── refreshStandings()
└── formatForDisplay()
```

#### 5. NHL API Client
**Responsibility:** Fetch scoring data

**Key Features:**
- Poll NHL API every 5 minutes
- Cache responses
- Handle errors gracefully
- Log API interactions

**Interfaces:**
```
APIClient
├── pollScoringEvents()
├── getScoringEvent(eventId)
├── cacheResponse(key, data)
└── handleError(error)
```

## Data Models (Simplified)

### Participant
```
{
  email: string (unique identifier),
  name: string,
  entryFee: number,
  createdAt: timestamp
}
```

### Entry
```
{
  id: string (unique identifier),
  email: string (participant email),
  playerIds: string[] (exactly 15 NHL player IDs),
  totalScore: number,
  createdAt: timestamp
}
```

### Player
```
{
  id: string (NHL API ID),
  name: string,
  position: string (F, D, G),
  team: string
}
```

### ScoringEvent
```
{
  id: string,
  playerId: string,
  eventType: string (goal, assist, win, shutout),
  timestamp: timestamp,
  pointsAwarded: number
}
```

### ScoringRules (Constants)
```
{
  goal: 1,
  assist: 1,
  win: 1,
  shutout: 2 (additional, total 3 with win)
}
```

## Error Handling

### API Integration Errors
- **Connection Failure:** Log error, continue with manual scoring capability, display status in admin console
- **Rate Limiting:** Implement exponential backoff, queue requests, notify admin
- **Invalid Response:** Log error, skip event, continue processing

### Data Validation Errors
- **Invalid Player Selection:** Display error message, prevent submission
- **Duplicate Selection:** Prevent selection, display warning
- **Score Update Failure:** Log error, retry with exponential backoff

### Authentication/Authorization Errors
- **Invalid Admin Password:** Log attempt, display error message
- **Unauthorized Access:** Redirect to public standings view

### Data Persistence Errors
- **Storage Full:** Log error, attempt cleanup, notify admin
- **Corrupted Data:** Log error, attempt recovery from backup

## Testing Strategy

### Unit Testing

**Scoring Engine Tests:**
- Test each scoring rule (goal, assist, win, shutout)
- Test point calculation accuracy
- Test event logging
- Test edge cases (duplicate events, invalid events)

**Validation Tests:**
- Test player selection validation (exactly 15 players)
- Test duplicate prevention
- Test position filtering

**Data Model Tests:**
- Test participant creation and deletion
- Test entry creation and modification
- Test score updates

**Example Test Cases:**
- Verify goal awards 1 point
- Verify shutout awards 3 points total (1 for win + 2 for shutout)
- Verify selecting 14 players prevents submission
- Verify selecting 16 players is rejected
- Verify duplicate player selection is prevented

### Property-Based Testing

Property-based tests will verify universal correctness properties across all inputs using a PBT library (e.g., fast-check for JavaScript, Hypothesis for Python).

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with design property reference
- Tag format: `Feature: nhl-playoff-pool, Property {number}: {property_text}`



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email as Unique Participant Identifier

*For any* two participants created with the same email address, the system SHALL reject the second creation and maintain only one participant record with that email.

**Validates: Requirements 1.2**

### Property 2: Multiple Unique Entries Per Participant

*For any* participant, creating multiple entries should result in each entry having a unique entry identifier, and all entries should be associated with the same participant.

**Validates: Requirements 1.3**

### Property 3: Entry Initialization with Empty Selection

*For any* newly created entry, the player selection list SHALL be empty and the total score SHALL be zero.

**Validates: Requirements 1.4**

### Property 4: Participant Display Accuracy

*For any* set of participants and their entries, the admin console display SHALL show all participants with their correct entry counts.

**Validates: Requirements 1.5**

### Property 5: Player Selection from All Positions

*For any* player position (forward, defenseman, goalie), players of that position SHALL be selectable in the player selector.

**Validates: Requirements 2.2**

### Property 6: Selection Count Validation - Fewer Than 15

*For any* entry with fewer than 15 selected players, entry submission SHALL be prevented.

**Validates: Requirements 2.3**

### Property 7: Selection Count Validation - Exactly 15

*For any* entry with exactly 15 selected players, entry submission SHALL be enabled.

**Validates: Requirements 2.4**

### Property 8: Selection Count Validation - More Than 15

*For any* attempt to select more than 15 players, the selection SHALL be prevented and an error message SHALL be displayed.

**Validates: Requirements 2.5**

### Property 9: Entry Submission Persistence with Timestamp

*For any* submitted entry, the system SHALL save the entry with a valid timestamp, and the timestamp SHALL be retrievable.

**Validates: Requirements 2.6**

### Property 10: Duplicate Player Prevention

*For any* entry, attempting to select the same player twice SHALL be prevented, and the player SHALL appear only once in the selection.

**Validates: Requirements 2.7**

### Property 11: Scoring Event Point Calculation

*For any* scoring event (goal, assist, win, shutout) and any entry containing the affected player, the system SHALL calculate and award the correct points according to the scoring rules.

**Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4**

### Property 12: Immediate Score Update

*For any* calculated scoring event, the entry's total score SHALL be updated immediately and the updated score SHALL be retrievable.

**Validates: Requirements 3.3**

### Property 13: Standings Reflect Current Scores

*For any* set of entries with processed scoring events, the standings display SHALL show all entries with their current total scores reflecting all processed events.

**Validates: Requirements 3.4, 3.5**

### Property 14: No Double-Counting of Events

*For any* scoring event processed twice (duplicate), the entry's score SHALL only increase by the points for a single event, not double.

**Validates: Requirements 4.5**

### Property 15: Scoring Event Logging

*For any* processed scoring event, the system SHALL create a log entry containing the event details, timestamp, and list of affected entries.

**Validates: Requirements 4.6**

### Property 16: Standings Sorted by Points Descending

*For any* set of entries, the standings display SHALL sort entries by total points in descending order (highest score first).

**Validates: Requirements 5.1**

### Property 17: Standings Display Required Information

*For any* entry in the standings display, the rendered output SHALL include the participant name, entry identifier, and total points.

**Validates: Requirements 5.2**

### Property 18: Tiebreaker by Entry Creation Timestamp

*For any* two entries with equal total points, the entry created earlier (earlier timestamp) SHALL appear first in the standings.

**Validates: Requirements 5.3**

### Property 19: Standings Auto-Refresh on Score Change

*For any* score update to an entry, the standings display SHALL automatically refresh to reflect the new score and re-sort if necessary.

**Validates: Requirements 5.4**

### Property 20: Admin Console Data Display Completeness

*For any* set of participants and entries in the system, the admin console display SHALL show all participants, all entries, and current scores for each entry.

**Validates: Requirements 6.2**

### Property 21: Manual Score Update Logging

*For any* manual score update by an admin, the system SHALL log the change with a timestamp and the admin identifier.

**Validates: Requirements 6.4**

### Property 22: CSV Export Completeness

*For any* export operation, the generated CSV file SHALL include all entries with participant names, entry identifiers, player selections, and total points.

**Validates: Requirements 7.1, 7.2**

### Property 23: API Unavailability Handling

*For any* period when the external API is unavailable, the system SHALL log the error and continue to accept manual score updates without interruption.

**Validates: Requirements 8.2**

### Property 24: API Polling Interval

*For any* running system, the API client SHALL poll the external API at regular intervals (approximately every 5 minutes) for new scoring events.

**Validates: Requirements 8.3**

### Property 25: API Response Caching

*For any* identical API request made within the cache TTL, the system SHALL return the cached response instead of making a new API call.

**Validates: Requirements 8.5**

### Property 26: API Rate Limit Handling

*For any* API rate limit response, the system SHALL implement exponential backoff and continue operation without crashing or losing data.

**Validates: Requirements 8.6**

### Property 27: Entry Fee Recording

*For any* created entry, the system SHALL record and persist the entry fee amount ($20).

**Validates: Requirements 9.1**

### Property 28: Total Fees Calculation

*For any* set of entries, the total entry fees displayed in the admin console SHALL equal the sum of all individual entry fees.

**Validates: Requirements 9.2**

### Property 29: Automatic Payout Calculation

*For any* number of entries, the system SHALL calculate payout amounts for 1st, 2nd, and 3rd place using the default percentages (50%, 30%, 20%) applied to total fees collected.

**Validates: Requirements 9.3, 9.4**

### Property 30: Data Persistence on Creation/Modification

*For any* entry created or modified, the system SHALL persist the data to storage such that it survives application restart.

**Validates: Requirements 10.1**

### Property 31: Data Loading on Application Startup

*For any* application restart, the system SHALL load all previously saved pool data (participants, entries, scores, events) into memory.

**Validates: Requirements 10.2**

### Property 32: Immediate Score Persistence

*For any* score update, the system SHALL persist the change to storage immediately (within the same transaction/operation).

**Validates: Requirements 10.3**

### Property 33: Data Integrity Across Restarts

*For any* data saved before application shutdown, the data SHALL be retrievable after application restart with no corruption or loss.

**Validates: Requirements 10.4**



## Error Handling

### API Integration Errors

**Connection Failure:**
- Log error with timestamp and error details
- Display "API Unavailable" status in admin console
- Continue operation with manual scoring capability
- Retry connection at exponential backoff intervals

**Rate Limiting (HTTP 429):**
- Implement exponential backoff (start at 1 second, double each retry, max 5 minutes)
- Queue pending requests
- Notify admin of rate limit status
- Continue processing cached data

**Invalid Response (Malformed JSON, Missing Fields):**
- Log error with response details
- Skip the problematic event
- Continue processing remaining events
- Alert admin to investigate

**Timeout:**
- Set request timeout to 30 seconds
- Log timeout error
- Retry with exponential backoff
- Fall back to manual scoring if persistent

### Data Validation Errors

**Invalid Player Selection:**
- Validate selection count before submission
- Display specific error message (e.g., "Please select exactly 15 players")
- Prevent submission
- Highlight missing or excess selections

**Duplicate Player Selection:**
- Prevent selection at UI level
- Display warning message
- Maintain current valid selection

**Invalid Entry Fee:**
- Validate fee is positive number
- Display error if invalid
- Prevent entry creation

### Authentication/Authorization Errors

**Invalid Admin Password:**
- Log failed attempt with timestamp and IP
- Display error message
- Limit login attempts (max 5 per minute)
- Implement account lockout after 10 failed attempts

**Unauthorized Access to Admin Console:**
- Redirect to public standings view
- Log unauthorized access attempt

### Data Persistence Errors

**Storage Full:**
- Log error
- Attempt to clean up old cached API responses
- Notify admin
- Prevent new data writes if cleanup fails

**Corrupted Data on Load:**
- Log corruption details
- Attempt recovery from backup if available
- Display error to user
- Provide manual recovery options

**Transaction Failure:**
- Rollback transaction
- Log error with details
- Retry operation
- Notify admin if persistent

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions with concrete test data.

**Scoring Engine Tests:**
- Goal scoring: Create entry with player, process goal event, verify 1 point awarded
- Assist scoring: Create entry with player, process assist event, verify 1 point awarded
- Win scoring: Create entry with goalie, process win event, verify 1 point awarded
- Shutout scoring: Create entry with goalie, process shutout event, verify 3 points total (1 for win + 2 for shutout)
- Duplicate event prevention: Process same event twice, verify points awarded only once
- Event logging: Process event, verify log entry created with timestamp and affected entries

**Validation Tests:**
- Selection with 14 players: Verify submission is prevented
- Selection with 15 players: Verify submission is enabled
- Selection with 16 players: Verify selection is prevented with error message
- Duplicate player selection: Verify duplicate is prevented
- Empty entry: Verify new entry has empty player list and zero score

**Data Model Tests:**
- Participant creation: Create participant, verify email is unique identifier
- Multiple entries: Create multiple entries for same participant, verify unique IDs
- Entry persistence: Create entry, verify it's saved and retrievable
- Score update: Update entry score, verify change is persisted

**Admin Console Tests:**
- Participant display: Create participants, verify all displayed with correct entry counts
- Manual score update: Update score manually, verify logged with timestamp and admin ID
- Export functionality: Export data, verify CSV contains all required fields

**API Integration Tests:**
- Connection failure: Simulate API unavailability, verify system continues with manual scoring
- Rate limiting: Simulate HTTP 429, verify exponential backoff is implemented
- Caching: Make duplicate requests, verify second request returns cached response

### Property-Based Testing

Property-based tests verify universal correctness properties across many randomly generated inputs using fast-check (JavaScript) or similar library.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with design property reference
- Tag format: `Feature: nhl-playoff-pool, Property {number}: {property_text}`

**Property Test Examples:**

**Property 1: Email Uniqueness**
```
Feature: nhl-playoff-pool, Property 1: Email as Unique Participant Identifier
For any participant email, creating a second participant with the same email 
should be rejected.
```

**Property 6: Selection Count Validation**
```
Feature: nhl-playoff-pool, Property 6-8: Selection Count Validation
For any number of selected players (0-20), verify that submission is only 
enabled when exactly 15 are selected.
```

**Property 11: Scoring Calculation**
```
Feature: nhl-playoff-pool, Property 11: Scoring Event Point Calculation
For any scoring event type (goal, assist, win, shutout) and any entry 
containing the affected player, verify the correct points are awarded 
according to the scoring rules.
```

**Property 16: Standings Sorting**
```
Feature: nhl-playoff-pool, Property 16-18: Standings Sorting
For any set of entries with various scores and creation timestamps, verify 
that standings are sorted by points descending, with ties broken by earliest 
creation timestamp first.
```

**Property 30-33: Data Persistence**
```
Feature: nhl-playoff-pool, Property 30-33: Data Persistence
For any data created or modified, verify that it persists across application 
restart and is retrievable without corruption.
```

### Integration Testing

Integration tests verify that components work together correctly:
- Admin creates participant → Entry created → Player selection → Score update → Standings updated
- API polling → Event processing → Score update → Standings refresh
- Manual score update → Logging → Standings update
- Export → CSV generation with all required data

### Test Coverage Goals

- Scoring Engine: 100% coverage of all scoring rules
- Validation Logic: 100% coverage of all validation rules
- Data Persistence: 100% coverage of save/load operations
- API Integration: 95% coverage (excluding external API failures)
- Overall: Minimum 85% code coverage

