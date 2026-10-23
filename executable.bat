@echo off
echo Demarrage du backend Django...
start cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

timeout /t 3

echo Demarrage du frontend React...
start cmd /k "cd frontend && npm run dev"

timeout /t 3
echo Ouverture du navigateur...
start http://localhost:5173