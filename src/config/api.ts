// Production MongoDB Service Configuration
// Update this file after deploying your backend to Railway

// STEP 1: After deploying backend to Railway, update this URL
const PRODUCTION_API_URL = 'https://your-tracker.railway.app/api'; // Replace with your Railway URL
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';

// Auto-detect environment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? DEVELOPMENT_API_URL 
  : PRODUCTION_API_URL;

export { API_BASE_URL };

// INSTRUCTIONS:
// 1. Deploy backend to Railway
// 2. Get your Railway URL (e.g., https://tracker-production-1a2b.railway.app)
// 3. Replace PRODUCTION_API_URL above with: https://your-railway-url.railway.app/api
// 4. Redeploy frontend to Vercel
// 5. Your app will automatically use the correct API URL based on environment
