# Deployment Guide - SSMS

This guide explains how to deploy the Smart Student Management System to Render (backend) and Vercel (frontend).

## Prerequisites

- Git installed
- Node.js 18+ installed
- Supabase account (already set up)
- Render account (free tier available)
- Vercel account (free tier available)

---

## Step 1: Deploy Backend to Render

### 1.1 Prepare Backend Files

The backend is located in the `navnathhtml` directory with the following structure:
```
navnathhtml/
├── server/           # Backend server code
├── public/           # Static frontend files
├── package.json
├── render.yaml       # Render configuration
└── .env              # Environment variables (do not commit!)
```

### 1.2 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ssms-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Root Directory**: `cclproject` (if deploying from monorepo)

### 1.3 Set Environment Variables on Render

In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `SUPABASE_URL` | `https://ndvqhdbnebqmueieblas.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your key) |
| `JWT_SECRET` | Generate a secure random string (64+ chars) |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` (add after frontend deployment) |

### 1.4 Deploy

Click **Create Web Service**. Render will build and deploy your backend.

**Note your backend URL** (e.g., `https://ssms-backend-xyz.onrender.com`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update Frontend Configuration

Edit `public/config.js` and update the API URL:

```javascript
window.API_CONFIG = {
  BASE_URL: 'https://your-backend-url.onrender.com/api'
};
```

Or create a separate production config:
```bash
cp public/config.prod.js public/config.js
# Then edit config.js with your Render backend URL
```

### 2.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Other`
   - **Root Directory**: `navnathhtml/public`
   - **Build Command**: (leave empty - no build needed for static files)
   - **Output Directory**: `public`

### 2.3 Alternative: Vercel CLI

```bash
cd navnathhtml/public
vercel --prod
```

### 2.4 Update CORS on Render

After Vercel deploys, go back to Render and update `CORS_ORIGIN`:
```
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## Step 3: Verify Deployment

1. Open your Vercel frontend URL
2. Try to login (you'll need to create a user in Supabase first)
3. Check browser console for any API errors
4. Verify CORS is working (check Network tab)

---

## Step 4: Create Initial Admin User

Since there's no registration for admin, create one directly in Supabase:

1. Go to Supabase Dashboard → Table Editor
2. Open `users` table
3. Insert a new row:
   - `email`: admin@example.com
   - `password_hash`: Generate bcrypt hash of your password
   - `full_name`: Admin User
   - `role`: `admin`
   - `status`: `active`

Or use the SQL Editor:
```sql
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'admin@example.com',
  '$2a$10$...', -- Generate with bcrypt
  'Admin User',
  'admin',
  'active'
);
```

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in Render matches your Vercel URL exactly
- Check for trailing slashes
- Add multiple origins comma-separated if needed

### API Not Found Errors
- Verify backend URL in `public/config.js`
- Check Render service is running (not in sleep mode)
- Free tier services sleep after 15 min inactivity

### Database Connection Errors
- Verify Supabase credentials in Render environment variables
- Check Supabase project is active

---

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key-min-64-chars
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (Vercel)
- No environment variables needed
- Configuration is in `public/config.js`

---

## Cost Estimate

- **Render Free Tier**: Free (with 15 min sleep timeout)
- **Vercel Free Tier**: Free for personal projects
- **Supabase Free Tier**: Free up to 500MB database

---

## Maintenance

### Updating Backend
Push to main branch → Render auto-deploys

### Updating Frontend
Push to main branch → Vercel auto-deploys

### Viewing Logs
- Render: Dashboard → Logs tab
- Vercel: Dashboard → Deployments → View logs
