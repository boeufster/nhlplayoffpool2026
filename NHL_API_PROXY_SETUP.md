# NHL API Proxy Setup

## Problem
Your local machine cannot resolve `statsapi.web.nhl.com` due to a DNS issue:
```
ping statsapi.web.nhl.com
Ping request could not find host statsapi.web.nhl.com
```

However, you can reach `api-web.nhle.com` which is a Cloudflare proxy (but it returns 404 for the endpoints we need).

## Solution
We've implemented a **Vite development proxy** that:
1. Intercepts requests to `/api/nhl-proxy?endpoint=...` on your local dev server
2. Forwards them to `https://statsapi.web.nhl.com/api/v1/...` from the server side
3. Returns the real NHL data to your app

This works because:
- Your local machine can't resolve the domain (DNS issue)
- But the Vite dev server can make outbound requests
- The proxy acts as a bridge between your app and the NHL API

## Files Changed

### 1. `.env.local` (NEW)
Enables the proxy in development mode:
```
VITE_USE_PROXY=true
VITE_API_PROXY=/api/nhl-proxy
```

### 2. `vite.config.js` (UPDATED)
Added proxy configuration:
```javascript
server: {
  proxy: {
    '/api/nhl-proxy': {
      target: 'https://statsapi.web.nhl.com/api/v1',
      changeOrigin: true,
      rewrite: (path) => {
        const url = new URL(path, 'http://localhost')
        const endpoint = url.searchParams.get('endpoint')
        return endpoint ? `/${endpoint}` : '/'
      }
    }
  }
}
```

### 3. `src/stores/nhlApi.js` (UPDATED)
Modified to use the proxy when `VITE_USE_PROXY=true`:
```javascript
const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true'

// In fetchPlayers():
let teamsUrl = `${API_BASE}/teams`
if (USE_PROXY) {
  teamsUrl = `/api/nhl-proxy?endpoint=teams`
}
```

### 4. `api/nhl-proxy.js` (NEW)
Serverless function for Vercel deployment (proxies NHL API requests).

## How to Test

### Local Development
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. The app will now:
   - Use the Vite proxy to fetch real NHL players
   - Display actual player names (not "Fake Player One", etc.)
   - Work around your local DNS issue

### Production (Vercel)
1. The `api/nhl-proxy.js` serverless function handles proxying
2. No DNS issues on Vercel's infrastructure
3. Real NHL data will be fetched automatically

## Expected Behavior

### Before (with DNS issue)
```
Available Players: [Fake Player One, Fake Player Two, ...]
```

### After (with proxy)
```
Available Players: [Connor McDavid, Leon Draisaitl, ...]
```

## Troubleshooting

If you still see fake players:

1. **Check if dev server is running:**
   ```bash
   npm run dev
   ```

2. **Verify proxy is enabled:**
   - Check `.env.local` exists with `VITE_USE_PROXY=true`
   - Check browser console for API logs

3. **Check network tab:**
   - Look for requests to `/api/nhl-proxy?endpoint=teams`
   - Should see 200 status with real team data

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Your Browser (localhost:5173)                               │
│                                                              │
│  PlayerSelectorView.vue                                     │
│    ↓                                                         │
│  nhlApi.js (fetchPlayers)                                   │
│    ↓                                                         │
│  axios.get('/api/nhl-proxy?endpoint=teams')                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Vite Dev Server (localhost:5173)                            │
│                                                              │
│  Proxy Middleware                                           │
│    ↓                                                         │
│  Rewrite: /api/nhl-proxy?endpoint=teams → /teams           │
│    ↓                                                         │
│  Forward to: https://statsapi.web.nhl.com/api/v1/teams    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ NHL API (statsapi.web.nhl.com)                              │
│                                                              │
│  Returns: { teams: [...real NHL teams...] }                │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. **Test locally** - Run `npm run dev` and verify you see real player names
2. **Deploy to Vercel** - The serverless function will handle proxying in production
3. **Monitor** - Check API logs in the admin panel to verify real data is being fetched

