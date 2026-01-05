# 🚀 PocketPilot Ultimate - Setup & Run Guide

A comprehensive guide to set up and run the PocketPilot Ultimate personal finance application.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool        | Version | Purpose             |
| ----------- | ------- | ------------------- |
| **Node.js** | v18+    | Backend & Frontend  |
| **Python**  | v3.9+   | AI Forecast Service |
| **npm**     | v9+     | Package management  |

---

## 🗄️ Database Setup (Supabase)

PocketPilot uses **Supabase** as its cloud database.

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose a name and password, then wait for provisioning (~2 minutes)

### Step 2: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy the entire contents of `backend/db/supabase_schema.sql`
3. Paste into the SQL Editor and click **Run**
4. You should see "Success" - all tables are now created

### Step 3: Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **service_role key** → `eyJhbGci...` (keep this secret!)

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

Create or update `backend/.env` with these values:

```env
# Database Mode
DATABASE_MODE=supabase

# Supabase Credentials
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=4000

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-here

# Forecast Service URL
FORECAST_URL=http://localhost:8080/predict
```

### Frontend (`frontend/.env.local`)

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🏃 Running the Application

### Option 1: Run Services Individually (Recommended for Development)

Open **3 separate terminal windows/tabs**:

#### Terminal 1: Backend API

```bash
cd backend
npm install
npm run dev
```

Expected output:

```
🚀 Using Supabase Database
🚀 Backend listening on 4000
```

#### Terminal 2: Frontend App

```bash
cd frontend
npm install
npm run dev
```

Expected output:

```
▲ Next.js 14.x
- Local: http://localhost:3000
```

#### Terminal 3: AI Forecast Service (Optional)

```bash
cd forecast_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn forecast_service:app --reload --port 8080
```

Expected output:

```
INFO: Uvicorn running on http://127.0.0.1:8080
```

### Option 2: Run All Web Services Together

From the root directory:

```bash
npm install
npm run dev
```

This starts both backend and frontend concurrently.

---

## 🌐 Access Points

Once running, access the application at:

| Service          | URL                   | Description           |
| ---------------- | --------------------- | --------------------- |
| **Frontend**     | http://localhost:3000 | Main web application  |
| **Backend API**  | http://localhost:4000 | REST API endpoints    |
| **Forecast API** | http://localhost:8080 | AI prediction service |

---

## 🔧 Troubleshooting

### Port Already in Use Error

If you see `EADDRINUSE: address already in use`:

```bash
# Kill all node processes
killall -9 node nodemon

# Or kill specific port (e.g., 4000)
lsof -ti:4000 | xargs kill -9
```

### macOS Port 5000 Issue

Port 5000 is used by AirPlay Receiver on macOS. We use port **4000** instead.

To disable AirPlay Receiver:

- **System Settings** → **General** → **AirDrop & Handoff** → Turn off **AirPlay Receiver**

### Supabase Connection Failed

1. Verify your `.env` credentials are correct
2. Check that `DATABASE_MODE=supabase` is set
3. Ensure the schema was run in Supabase SQL Editor

---

## 📁 Project Structure

```
PocketPilot_Ultimate/
├── backend/               # Express.js API server
│   ├── server.js         # Main server file
│   ├── supabase.js       # Supabase connection
│   ├── db/
│   │   └── supabase_schema.sql  # Database schema
│   └── .env              # Backend environment variables
│
├── frontend/             # Next.js web application
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   └── contexts/    # Auth context
│   └── .env.local       # Frontend environment variables
│
├── forecast_service/     # Python AI prediction service
│   ├── forecast_service.py
│   ├── train_model.py
│   └── requirements.txt
│
└── SETUP_GUIDE.md       # This file
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| POST   | `/api/register` | Register new user                |
| POST   | `/api/login`    | Login user                       |
| GET    | `/api/user`     | Get current user (requires auth) |

### Dashboard

| Method | Endpoint          | Description                 |
| ------ | ----------------- | --------------------------- |
| GET    | `/api/dashboard`  | Get savings & subscriptions |
| PATCH  | `/api/user/ghost` | Toggle ghost mode           |

### Transactions

| Method | Endpoint                | Description        |
| ------ | ----------------------- | ------------------ |
| GET    | `/api/transactions`     | List transactions  |
| POST   | `/api/transactions`     | Add transaction    |
| PATCH  | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Budgets

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/budgets`     | List budgets      |
| POST   | `/api/budgets`     | Set/update budget |
| DELETE | `/api/budgets/:id` | Delete budget     |

### AI Forecast

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| POST   | `/api/forecast` | Get AI spending prediction |

---

## ✅ Quick Start Checklist

- [ ] Supabase project created
- [ ] Database schema executed in SQL Editor
- [ ] `backend/.env` configured with Supabase credentials
- [ ] `frontend/.env.local` configured
- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] (Optional) Forecast service running on port 8080

---

## 🎉 You're Ready!

Visit **http://localhost:3000** to start using PocketPilot Ultimate!

For questions or issues, check the troubleshooting section above.
