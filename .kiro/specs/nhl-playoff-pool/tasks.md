# Stevey's NHL Playoff Pool - Implementation Tasks

## Phase 1: Project Setup

- [x] 1.1 Initialize Vue.js 3 project with Vite
- [x] 1.2 Set up Pinia for state management
- [x] 1.3 Install Axios for API calls
- [x] 1.4 Configure Vercel deployment
- [x] 1.5 Set up Git repository

## Phase 2: Core Data Layer

- [x] 2.1 Create Pinia store for participants
- [x] 2.2 Create Pinia store for entries
- [x] 2.3 Create Pinia store for scores
- [x] 2.4 Implement LocalStorage persistence
- [x] 2.5 Create data loading on app startup

## Phase 3: Frontend Components

- [x] 3.1 Create main app layout and routing
- [x] 3.2 Create standings display component
- [x] 3.3 Create player selector component
- [x] 3.4 Create admin panel component
- [x] 3.5 Implement navigation between views

## Phase 4: Player Selection Logic

- [x] 4.1 Load NHL players from API
- [x] 4.2 Implement position filtering (F, D, G)
- [x] 4.3 Implement player selection (exactly 15)
- [x] 4.4 Prevent duplicate selections
- [x] 4.5 Implement entry submission with timestamp

## Phase 5: Scoring Engine

- [x] 5.1 Implement scoring rules (goals, assists, wins, shutouts)
- [x] 5.2 Create scoring event processor
- [x] 5.3 Prevent double-counting of events
- [x] 5.4 Update entry scores
- [x] 5.5 Log scoring events

## Phase 6: NHL API Integration

- [x] 6.1 Create NHL API client
- [x] 6.2 Implement polling (every 5 minutes)
- [x] 6.3 Implement response caching
- [x] 6.4 Handle API errors gracefully
- [x] 6.5 Log API interactions

## Phase 7: Admin Panel

- [x] 7.1 Create password-protected admin view
- [x] 7.2 Implement participant management (add/remove)
- [x] 7.3 Implement entry management (add/remove)
- [x] 7.4 Implement manual score updates
- [x] 7.5 Implement CSV export

## Phase 8: Standings Display

- [x] 8.1 Sort entries by points (descending)
- [x] 8.2 Implement tiebreaker (earliest entry first)
- [x] 8.3 Auto-refresh on score updates
- [x] 8.4 Display participant name, entry ID, points
- [x] 8.5 Make standings publicly accessible

## Phase 9: Testing

- [x] 9.1 Write tests for scoring rules (goals, assists, wins, shutouts)
- [x] 9.2 Write tests for player selection validation (exactly 15)
- [x] 9.3 Write tests for duplicate prevention
- [x] 9.4 Write tests for standings sorting
- [x] 9.5 Write tests for data persistence
- [x] 9.6 Write property-based tests for correctness properties

## Phase 9.5: NHL API Verification

- [x] 9.5.1 Test NHL API endpoints with real data
- [x] 9.5.2 Verify player data structure and availability
- [x] 9.5.3 Verify game/score data endpoints
- [x] 9.5.4 Document API response formats
- [x] 9.5.5 Create integration test for live API calls

## Phase 10: Deployment

- [-] 10.1 Deploy to Vercel
- [ ] 10.2 Test all features in production
- [ ] 10.3 Create user documentation
- [ ] 10.4 Set up monitoring and error logging

