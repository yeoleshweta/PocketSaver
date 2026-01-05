# PocketPilot Ultimate - Setup & Run Guide

This guide details how to set up and run the PocketPilot Ultimate application locally.

## Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.9+)
- **PostgreSQL** (v14+)
- **Docker** (Optional, for containerized run)

---

## 🚀 Quick Start (Manual Setup)

Running the application manually ensures all services (Frontend, Backend, Forecast Engine) are active.

### 1. Database Setup (Supabase)

We recommend using **Supabase** for the database. Follow these steps:

#### a. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

#### b. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy the contents of `backend/db/supabase_schema.sql` and run it
3. This creates all necessary tables (users, transactions, savings, subscriptions, budgets, categories)

#### c. Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role** key (secret - keep this safe!)

#### d. Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update `backend/.env` with your Supabase credentials:
   ```env
   DATABASE_MODE=supabase
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret-key
   ```

#### Alternative: Local PostgreSQL

If you prefer local development with Docker:

```bash
# Set DATABASE_MODE=local in backend/.env
docker-compose up db
```

### 2. Forecast Service (Python)

This service must be running for predictions to work.

1. Navigate to the service directory:
   ```bash
   cd forecast_service
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the service:
   ```bash
   # Runs on localhost:8000 by default (check/update backend env if different)
   uvicorn forecast_service:app --reload --port 8080
   ```

### 3. Backend & Frontend

The root directory allows running both web services simultaneously.

1. Install dependencies:

   ```bash
   # Root (for concurrency)
   npm install

   # Backend
   cd backend && npm install
   cd ..

   # Frontend
   cd frontend && npm install
   cd ..
   ```

2. Environment Configuration:

   - Ensure `backend/.env` has the correct `DATABASE_URL` and `FORECAST_URL` (usually `http://localhost:8080/predict`).
   - Ensure `frontend/.env.local` has `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5001` or `http://localhost:5000`).

3. Start the Web Stack:
   ```bash
   # From the root directory
   npm run dev
   ```
   - **Frontend**: http://localhost:3000
   - **Backend**: http://localhost:5001 (or 5000)

---

## 🐳 Docker Setup

You can run the web stack (Frontend + Backend + DB) using Docker Compose.

**Note**: The current `docker-compose.yml` **does not include the Python Forecast Service**. You will still need to run the Python service manually (Step 2 above) or add it to the compose file for full functionality.

```bash
docker-compose up --build
```

This will start:

- **Postgres Database**
- **Backend API** (mapped to port 5001)
- **Frontend App** (mapped to port 3001)

---

## API Endpoints

### Backend

- `GET /health` - Check if backend is running.
- `POST /api/register` - Register a new user.
- `POST /api/forecast` - Proxy request to the Python service.

### Forecast Service

- `POST /predict` - Direct endpoint to get prediction (requires JSON body with `days_since_start`, `current_price`, `horizon`).
