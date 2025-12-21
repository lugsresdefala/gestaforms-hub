# Deployment Guide - GestaForms Hub

## Overview

This document describes how to deploy the GestaForms Hub application to production environments.

## Prerequisites

- Node.js 18+ and npm
- Supabase account with project configured
- Deployment platform account (Vercel, Netlify, or similar)

## Environment Variables

The following environment variables **must** be configured in your production environment:

### Required Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key_here
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL for `VITE_SUPABASE_URL`
4. Copy the anon/public key for `VITE_SUPABASE_PUBLISHABLE_KEY`

⚠️ **Important**: Without these variables properly configured, the application will build successfully but will fail at runtime for authentication and database operations.

## Deployment Methods

### Method 1: Lovable (Recommended)

This is the simplest deployment method for this project:

1. Open [Lovable Project](https://lovable.dev/projects/eed564ff-47e6-49d6-853c-b745c0fc6b35)
2. Click on **Share** → **Publish**
3. Follow the prompts to deploy
4. Configure environment variables in the Lovable dashboard

### Method 2: Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   # From project root
   vercel
   
   # Follow the prompts
   # For production deployment:
   vercel --prod
   ```

3. **Deploy via GitHub Integration**:
   - Connect your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Push to main branch to trigger deployment

4. **Configure Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Method 3: Netlify

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy via CLI**:
   ```bash
   # Build the project
   npm run build
   
   # Deploy
   netlify deploy --prod --dir=dist/public
   ```

3. **Deploy via GitHub Integration**:
   - Connect repository to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Configure environment variables in Netlify dashboard

### Method 4: Render

1. Deploy as a **Web Service** on Render using the provided `render.yaml` (auto-detected).
2. Build command: `npm install && npm run build` (from `render.yaml`)
3. Start command: `npm start` (serves built assets and APIs on `process.env.PORT`)
4. Health check path: `/api/health`
5. Required environment variables in Render dashboard:
   - `DATABASE_URL` (Postgres connection string)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Method 5: Manual Deployment

For custom servers or hosting providers:

1. **Build the application**:
   ```bash
   npm install
   npm run build
   ```

2. **Output location**: `dist/public/`

3. **Serve the static files**:
   - Configure your web server to serve files from `dist/public/`
   - Set up SPA routing (all routes should serve `index.html`)
   - Configure HTTPS (required for production)

## Build Configuration

### Production Build

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles React application with Vite
- Minifies and optimizes assets
- Outputs to `dist/public/`

### Build Verification

After building, verify:

```bash
# Check build output
ls -la dist/public/

# Expected files:
# - index.html
# - assets/ (CSS, JS bundles)
# - favicon.ico
# - Other static assets
```

## Post-Deployment Checklist

After deploying, verify the following:

- [ ] Application loads without errors
- [ ] Authentication works (login/logout)
- [ ] Database queries work correctly
- [ ] Environment variables are correctly configured
- [ ] HTTPS is enabled
- [ ] Security headers are properly set (see vercel.json)
- [ ] Asset caching is working (check browser network tab)

## Security Considerations

### Headers

The production configuration includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

These are configured in `vercel.json` and should be replicated in other deployment platforms.

### Environment Variables

- Never commit `.env` files to version control
- Use `.env.example` as a template
- Configure production variables in your hosting platform's dashboard
- Rotate Supabase keys if they are ever exposed

### Database Security

- Row-Level Security (RLS) is enabled in Supabase
- All queries are filtered by user permissions
- Verify RLS policies are active in Supabase dashboard

## Monitoring and Maintenance

### Logging

- Application logs are available in the browser console
- Server-side logs (if any) are in your hosting platform's dashboard
- Supabase logs are available in the Supabase dashboard

### Updates

To update the production deployment:

1. Make changes in your local environment
2. Test thoroughly
3. Commit and push to GitHub
4. Deployment will trigger automatically (if using CI/CD)
5. Or manually deploy using the CLI/dashboard

### Rollback

If issues occur:

**Vercel/Netlify**: Use the dashboard to rollback to a previous deployment

**Lovable**: Revert to a previous publish version

**Manual**: Redeploy a previous build

## Troubleshooting

### Build Fails

- Check Node.js version (requires 18+)
- Verify all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`

### Runtime Errors

1. **"Supabase not configured"**:
   - Verify environment variables are set correctly
   - Check that variables start with `VITE_` prefix

2. **Authentication fails**:
   - Verify Supabase URL and key are correct
   - Check Supabase project is active
   - Verify RLS policies allow operations

3. **Assets not loading**:
   - Check build output directory matches deployment configuration
   - Verify SPA routing is configured correctly
   - Check browser console for 404 errors

### Performance Issues

- Enable caching for static assets
- Use CDN if available
- Monitor Supabase quotas and performance
- Check for large bundle sizes: `npm run build` shows bundle analysis

## Support

For deployment issues:
- Check this documentation
- Review [README.md](./README.md) for general setup
- Check Supabase dashboard for database issues
- Review hosting platform documentation

## Version Information

- **Build Tool**: Vite 5.4.x
- **Framework**: React 18.3.x
- **Backend**: Supabase
- **Recommended Node**: 18.x or higher
- **Deployment Platforms**: Lovable, Vercel, Netlify, or any static host
