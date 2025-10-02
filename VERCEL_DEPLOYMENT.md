# Vercel Deployment Guide

## Environment Variables

Add these environment variables in your Vercel dashboard under Project Settings > Environment Variables:

### Production Environment Variables
```
VITE_GOOGLE_CLIENT_ID=893401342423-l0esr36qa18jma26c7umr2j602etol9r.apps.googleusercontent.com
VITE_GEMINI_API_KEY=AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ

# Backend Environment Variables (for /api routes)
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
GEMINI_API_KEY=AIzaSyCws7KhsxoObBmTdaRLJXy_YRAmGaCleNQ
OPENROUTER_API_KEY=your-openrouter-api-key
NODE_ENV=production
```

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

- **"Unexpected token 'T'" error**: This typically means the frontend is trying to parse HTML (error page) as JSON. Check that all environment variables are set correctly in Vercel.
- **CORS issues**: The backend is configured to handle CORS automatically.
- **Database connection**: Make sure your MongoDB URI is correct and the database allows connections from Vercel's IP ranges.