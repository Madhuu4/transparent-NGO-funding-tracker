#!/bin/bash
# start.sh — run both backend and frontend concurrently

set -e

echo "🌱 Starting NGO Funding Tracker..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
echo "🚀 Starting FastAPI backend on :8000"
uvicorn main:app --reload --port 8000 &
BACK_PID=$!
cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install -q
echo "⚡ Starting React frontend on :3000"
npm run dev &
FRONT_PID=$!
cd ..

echo ""
echo "✅ Both servers are running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACK_PID $FRONT_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
