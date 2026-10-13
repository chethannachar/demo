# React + FastAPI deployment demo

This small demo saves and retrieves non-sensitive sample values from PostgreSQL.
It is not an authentication system; do not use real passwords.

## Local setup

1. Create a PostgreSQL database with a hosted provider such as Render PostgreSQL
   or Neon. Fill in `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
   in the root `.env` using the values supplied by your provider. The backend
   requires SSL for PostgreSQL connections and creates its `records` table the
   first time a record is saved or read.
2. In a terminal at the project root, install and start the backend:

   ```powershell
   py -m venv backend\.venv
   backend\.venv\Scripts\Activate.ps1
   pip install -r backend\requirements.txt
   uvicorn main:app --app-dir backend --reload --port 8000
   ```

3. In a second terminal at the project root, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Enter a username and sample value to save,
   then enter that username in the retrieve form.

## Deployment settings

- **Render web service:** Root Directory `backend`; Build Command
  `pip install -r requirements.txt`; Start Command
  `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `DB_HOST`, `DB_PORT`,
  `DB_NAME`, `DB_USER`, and `DB_PASSWORD` individually from your PostgreSQL
  provider, and set `FRONTEND_URL` to the Vercel site origin (for example,
  `https://your-app.vercel.app`). The API also allows preview origins matching
  `https://demo-<deployment>-chethans-projects-92437806.vercel.app`.
- **Vercel project:** Root Directory `frontend`; Framework Preset `Vite`;
  Build Command `npm run build`; Output Directory `dist`. Set `VITE_API_URL`
  to the Render service base URL without a trailing slash.

Set those environment variables in the hosting providers; the local root `.env`
is ignored by Git and is not needed in production.

## Database values to obtain

Copy these five values from the PostgreSQL provider's connection settings:

- `DB_HOST`: database server hostname
- `DB_PORT`: PostgreSQL port (usually `5432`)
- `DB_NAME`: database name
- `DB_USER`: database username
- `DB_PASSWORD`: database password
