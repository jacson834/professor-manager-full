# Iniciar programa.ps1

# --- Iniciar o Backend ---
Write-Host "Starting Backend (Node.js/Express)..."
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -Command `cd \"$PSScriptRoot\backend\"; npm install; npm start`"

# --- Iniciar o Frontend (Vite) ---
Write-Host "Starting Frontend (Vite)..."
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -Command `cd \"$PSScriptRoot\"; npm install; npm run dev`"

# --- Abrir o navegador automaticamente ---
# Dê um pequeno tempo para o frontend iniciar antes de abrir o navegador
Write-Host "Giving the frontend a moment to start..."
Start-Sleep -Seconds 5
Write-Host "Opening browser..."
Start-Process "http://localhost:8080"

Write-Host "All servers are starting in separate windows and browser is opening."