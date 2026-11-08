@echo off
echo ===================================================
echo Starting DataQualAI (FastAPI + React Fullstack Server)
echo ===================================================
cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
