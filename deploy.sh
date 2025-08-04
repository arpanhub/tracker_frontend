#!/bin/bash

echo "🚀 Deploying Arpan's Financial Tracker to Production"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Installing dependencies..."
npm install
cd server && npm install && cd ..

echo "🏗️ Step 2: Building frontend for production..."
npm run build

echo "🧪 Step 3: Testing build..."
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful!"

echo ""
echo "🌐 Next Steps for Deployment:"
echo "=============================="
echo ""
echo "📱 FRONTEND (Vercel):"
echo "1. Go to https://vercel.com"
echo "2. Import this GitHub repository"
echo "3. Deploy automatically"
echo "4. Get your Vercel URL (e.g., https://your-tracker.vercel.app)"
echo ""
echo "🛠️ BACKEND (Railway):"
echo "1. Go to https://railway.app"
echo "2. Create new project from GitHub"
echo "3. Set these environment variables:"
echo "   MONGODB_URI=mongodb+srv://arpangupta:arpanmongodb@cluster0.azri6.mongodb.net/tracker?retryWrites=true&w=majority"
echo "   PORT=5000"
echo "   NODE_ENV=production"
echo "4. Set root directory to: /server"
echo "5. Deploy automatically"
echo ""
echo "🔗 CONNECT FRONTEND TO BACKEND:"
echo "1. Get your Railway backend URL (e.g., https://your-tracker.railway.app)"
echo "2. Update src/services/mongoService.ts with your Railway URL"
echo "3. Redeploy frontend"
echo ""
echo "✅ Your app will be live at both URLs!"
echo ""
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions"
