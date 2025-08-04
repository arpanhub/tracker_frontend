@echo off
echo 🚀 Starting Arpan's Financial Tracker with MongoDB Cloud Sync
echo.
echo 📋 Starting Backend Server...
cd server
start "Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
echo.
echo 🌐 Starting Frontend Development Server...
cd ..
start "Frontend Dev Server" cmd /k "npm run dev"
echo.
echo ✅ Both servers are starting!
echo 📊 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo 📖 Check TEST_WALKTHROUGH.md for complete testing guide
pause
