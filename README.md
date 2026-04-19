# Stevey's NHL Playoff Pool

A Vue.js 3 single-page application for managing a fantasy hockey pool during the NHL playoffs.

## Project Setup

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm run test:run
```

## Project Structure

```
├── src/
│   ├── main.js              # Application entry point
│   ├── App.vue              # Root component
│   ├── views/               # Page components
│   │   ├── StandingsView.vue
│   │   └── AdminView.vue
│   ├── stores/              # Pinia state management
│   │   ├── participants.js
│   │   ├── entries.js
│   │   └── scores.js
│   └── components/          # Reusable components
├── public/                  # Static assets
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── vitest.config.js         # Vitest configuration
└── package.json             # Project dependencies
```

## Features

- **Standings Display**: View all entries ranked by points
- **Admin Console**: Manage participants and entries (password protected)
- **Player Selection**: Select exactly 15 players for an entry
- **Scoring Engine**: Automatic point calculation based on NHL events
- **Data Persistence**: All data saved to browser LocalStorage

## Technology Stack

- **Vue.js 3**: Progressive JavaScript framework
- **Vite**: Next generation frontend build tool
- **Pinia**: State management for Vue
- **Axios**: HTTP client for API calls
- **Vitest**: Unit testing framework
- **fast-check**: Property-based testing library

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

## Admin Console

Access the admin console by clicking the "Admin" button in the navigation. Default password is `admin123`.
