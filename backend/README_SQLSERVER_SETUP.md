# CredVaniAI – Microsoft SQL Server & FastAPI Setup Guide

During environment inspection of this runtime container, Microsoft SQL Server (`mssql-server`), `sqlcmd`, `odbcinst`, and Python `pip`/`uvicorn`/`pyodbc` were not pre-installed. All FastAPI code, SQLAlchemy models, Alembic migrations, and T-SQL schema scripts have been created inside `/backend` and are ready to run once SQL Server is installed on your host/server.

## 1. Install Microsoft SQL Server & ODBC Driver 18

### Option A: Docker (Cross-Platform Fastest Setup)
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name credvani-mssql -d mcr.microsoft.com/mssql/server:2022-latest
```

### Option B: Windows
1. Install **SQL Server 2022 Express / Developer Edition** from Microsoft.
2. Install **Microsoft ODBC Driver 18 for SQL Server**.
3. Enable TCP/IP on port `1433` in SQL Server Configuration Manager.
4. Set `MSSQL_AUTH_MODE=windows` in `.env` for Windows Authentication, or `MSSQL_AUTH_MODE=sql` with `MSSQL_USER` / `MSSQL_PASSWORD` for SQL Server Authentication.

### Option C: Debian / Ubuntu Linux
```bash
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
sudo apt-get update && sudo apt-get install -y msodbcsql18 unixodbc-dev mssql-server
sudo /opt/mssql/bin/mssql-conf setup
```

## 2. Configure `.env`
Copy `.env.example` to `.env` and populate:
- `MSSQL_SERVER=localhost`
- `MSSQL_PORT=1433`
- `MSSQL_DATABASE=CredVaniAI_DB`
- `MSSQL_AUTH_MODE=sql` (or `windows`)
- `MSSQL_USER=...` and `MSSQL_PASSWORD=...` (when `sql`)
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (strong random 64-char secrets)
- `GEMINI_API_KEY` (for 14-language AI advisory)

## 3. Install Python Dependencies, Run Migrations & Seed
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create CredVaniAI_DB and seed 14 languages, 10 loan categories, and bank products
python scripts/init_db.py

# Or apply Alembic migrations directly after creating CredVaniAI_DB:
alembic upgrade head

# Start FastAPI backend on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 4. Connect Frontend / Port 3000 Gateway to FastAPI
Set `FASTAPI_BACKEND_URL=http://127.0.0.1:8000` in `.env` and run `npm run dev`. The Express server on port 3000 automatically proxies `/api/*` requests to FastAPI + SQL Server (`CredVaniAI_DB`).
