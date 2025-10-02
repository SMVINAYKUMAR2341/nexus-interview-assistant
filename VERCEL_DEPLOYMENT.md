# Vercel Deployment Guide

## Environment Variables

Add these environment variables in your Vercel dashboard under Project Settings > Environment Variables:

### Production Environment Variables
```
# Frontend Environment Variables
VITE_GOOGLE_CLIENT_ID=893401342423-l0esr36qa18jma26c7umr2j602etol9r.apps.googleusercontent.com
VITE_GEMINI_API_KEY=AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ

# Backend Environment Variables (for /api routes)
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
GEMINI_API_KEY=AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ
OPENROUTER_API_KEY=your-openrouter-api-key
NODE_ENV=production

# Google OAuth Configuration (CRITICAL for Google Login)
GOOGLE_CLIENT_ID=893401342423-l0esr36qa18jma26c7umr2j602etol9r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

## Google OAuth Configuration (CRITICAL STEP)

**Before deployment works**, you MUST update your Google OAuth settings:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth 2.0 Client ID**: `893401342423-l0esr36qa18jma26c7umr2j602etol9r.apps.googleusercontent.com`
3. **Add your Vercel domain** to Authorized JavaScript Origins:
   - `https://crisp-interview-assistant-17j9jjpnh-sm-vinay-kumars-projects.vercel.app`
   - `https://*.vercel.app` (for future deployments)
4. **Add callback URLs** to Authorized Redirect URIs:
   - `https://crisp-interview-assistant-17j9jjpnh-sm-vinay-kumars-projects.vercel.app/api/auth/google/callback`

## Important Notes

1. **API URL**: In production, the frontend automatically uses relative URLs (`/api`) to connect to the backend running on the same Vercel domain.

2. **Local Development**: For local development, make sure your `.env` file contains:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Backend Routes**: All API routes are automatically routed to `/backend/server.js` via the `vercel.json` configuration.

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy the project
4. The build will automatically:
   - Build the frontend React app
   - Deploy the backend as serverless functions
   - Route `/api/*` requests to the backend

## Troubleshooting

### "Invalid Google Token" Error
This means your Google OAuth is not configured correctly:
1. **Check Google Console**: Make sure your Vercel domain is added to Authorized JavaScript Origins
2. **Verify Environment Variables**: Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel
3. **Check Client ID Match**: Frontend `VITE_GOOGLE_CLIENT_ID` must match backend `GOOGLE_CLIENT_ID`
4. **Update FRONTEND_URL**: Set `FRONTEND_URL` to your actual Vercel domain

### Other Common Issues
- **"Unexpected token 'T'" error**: This typically means the frontend is trying to parse HTML (error page) as JSON. Check that all environment variables are set correctly in Vercel.
- **CORS issues**: The backend is configured to handle CORS automatically.
- **Database connection**: Make sure your MongoDB URI is correct and the database allows connections from Vercel's IP ranges.

### Environment Variables Checklist
Make sure ALL these are set in Vercel dashboard:
- ✅ `VITE_GOOGLE_CLIENT_ID`
- ✅ `VITE_GEMINI_API_KEY` 
- ✅ `GOOGLE_CLIENT_ID` (backend)
- ✅ `GOOGLE_CLIENT_SECRET` (backend)
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`
- ✅ `FRONTEND_URL`
- ✅ `NODE_ENV=production`
