# SSMS Frontend

Static frontend for the Smart Student Management System.

## Deployment to Vercel

### Option 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Set **Root Directory** to `navnathhtml/public`
5. Deploy

### Option 2: Vercel CLI

```bash
npm install -g vercel
cd public
vercel --prod
```

## Configuration

Before deploying, update `public/config.js` with your Render backend URL:

```javascript
window.API_CONFIG = {
  BASE_URL: 'https://your-backend-url.onrender.com/api'
};
```

## Files

- `config.js` - API configuration (update for production)
- `config.prod.js` - Production config template
- `vercel.json` - Vercel deployment configuration

## Local Development

For local development, serve the files with a simple HTTP server:

```bash
# Using Python
python -m http.server 5173

# Using Node
npx serve .

# Using PHP
php -S localhost:5173
```

Then open `http://localhost:5173` in your browser.
