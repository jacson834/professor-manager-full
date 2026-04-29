@echo off
title ProfessorManager Servers

REM --- Iniciar o Backend ---
echo Starting Backend (Node.js/Express)...
start cmd /k "cd /d "%~dp0backend" && npm install && npm start"

REM --- Iniciar o Frontend (Vite) ---
echo Starting Frontend (Vite)...
start cmd /k "cd /d "%~dp0" && npm install && npm run dev"

REM --- Abrir o navegador automaticamente ---
REM Dê um pequeno tempo para o frontend iniciar antes de abrir o navegador
timeout /t 5 /nobreak > nul
echo Opening browser...
start "" "http://localhost:8080"

echo All servers are starting in separate windows and browser is opening.
exit