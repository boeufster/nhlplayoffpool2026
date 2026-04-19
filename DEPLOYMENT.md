# Vercel Deployment Guide

## Overview

This NHL Playoff Pool application is configured for deployment to Vercel. It's a Vue.js 3 single-page application (SPA) built with Vite, requiring no backend infrastructure.

## Deployment Configuration

### Files

- **vercel.json**: Vercel deployment configuration
- **vite.config.js**: Vite build configuration optimized for Vercel
- **package.json**: Build scripts and dependencies

### Build Configuration

The application is configured with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Node Version**: 18.x (default on Vercel)

### Environment Variables

The following environment variables can be configured in Vercel:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL for NHL API calls | `https://statsapi.web.nhl.com/api/v1` |

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in or create an account
3. Click "Add New..." → "Project"
4. Import your Git repository (GitHub, GitLab, or Bitbucket)
5. Select the repository containing this project

### 2. Configure Project Settings

1. **Project Name**: Enter your desired project name
2. **Framework Preset**: Should auto-detect as "Vite"
3. **Build Command**: Verify it's set to `npm run build`
4. **Output Directory**: Verify it's set to `dist`
5. **Install Command**: Verify it's set to `npm install`

### 3. Set Environment Variables (Optional)

If you need to override the default NHL API URL:

1. Go to Project Settings → Environment Variables
2. Add `VITE_API_BASE_URL` with your custom value
3. Ensure it's set for Production, Preview, and Development environments

### 4. Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. Your application will be available at `https://[project-name].vercel.app`

## Routing Configuration

The `vercel.json` file includes a catch-all route that redirects all requests to `index.html`. This is essential for Vue Router to work correctly in a SPA:

```json
"routes": [
  {
    "src": "/(.*)",
    "dest": "/index.html",
    "status": 200
  }
]
```

This ensures that:
- Direct navigation to any route works correctly
- Page refreshes don't result in 404 errors
- Vue Router can handle all routing client-side

## Build Output

The Vite build produces optimized output:

- **JavaScript**: Minified and split into chunks (vue, pinia, axios, main app)
- **CSS**: Minified and extracted
- **Assets**: Optimized and cached with content hashes
- **Size**: ~100KB gzipped (including all dependencies)

## Continuous Deployment

Once connected to Vercel:

1. **Automatic Deployments**: Every push to your main branch triggers a new deployment
2. **Preview Deployments**: Pull requests automatically get preview URLs
3. **Rollback**: Previous deployments can be rolled back instantly from the Vercel dashboard

## Troubleshooting

### Build Fails

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are listed in `package.json`
3. Verify Node version compatibility (18.x recommended)
4. Run `npm run build` locally to reproduce issues

### Application Shows Blank Page

1. Check browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Check that `index.html` is being served for all routes
4. Verify the `dist` folder contains all necessary files

### API Calls Fail

1. Verify `VITE_API_BASE_URL` environment variable is set correctly
2. Check browser console for CORS errors
3. Ensure the NHL API endpoint is accessible from Vercel's servers
4. Check network tab in browser DevTools for failed requests

## Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

This will serve the `dist` folder locally, simulating the Vercel production environment.

## Performance Optimization

The application is optimized for Vercel with:

- **Code Splitting**: Dependencies split into separate chunks for better caching
- **Minification**: JavaScript and CSS minified with Terser
- **Asset Hashing**: Content-based hashing for cache busting
- **Gzip Compression**: Automatic compression by Vercel

## Security Considerations

- **No Sensitive Data**: All data is stored in browser LocalStorage
- **HTTPS**: Vercel automatically provides HTTPS
- **Admin Password**: Implement strong password protection in the admin console
- **API Calls**: NHL API calls are read-only and don't require authentication

## Monitoring

After deployment:

1. Monitor application performance in Vercel Analytics
2. Set up error tracking (optional: Sentry, LogRocket, etc.)
3. Monitor API response times and error rates
4. Check browser console for any runtime errors

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Vue.js 3 Documentation](https://vuejs.org)
- [NHL API Documentation](https://gitlab.com/dword4/nhl-api-docs)
