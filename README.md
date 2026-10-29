# Eventora - Full-Stack MERN Event Platform

An enterprise-grade Full-Stack MERN application designed with a professional Monorepo architecture for **atomic deployment on Vercel** (Vite React SPA Frontend + Express Serverless API) paired with **MongoDB Atlas Cloud Database**.

---

## 🏛️ Monorepo Architecture Overview

This project is organized as a unified npm workspace monorepo. It deploys as a **single Vercel project**, serving the frontend static build from the edge CDN while running the backend API on Vercel Serverless Functions.

```
Eventora-MERN-main/
├── api/
│   └── index.js              # Vercel Serverless Function entry point (Express bridge)
├── client/                   # Frontend Workspace (React 18, Vite, Tailwind CSS)
│   ├── src/                  # Components, Pages, Context, Axios config
│   ├── index.html
│   ├── package.json
│   └── vite.config.js        # Vite dev proxy configuration
├── server/                   # Backend Workspace (Express, Mongoose, JWT, Nodemailer)
│   ├── config/
│   │   └── db.js             # Serverless-optimized MongoDB Atlas connection pool
│   ├── controllers/          # Auth, Event, and Booking controllers
│   ├── middleware/           # Auth and role verification
│   ├── models/               # Mongoose schemas (User, Event, Booking, OTP)
│   ├── routes/               # Modular Express API routers
│   ├── utils/                # Email & OTP handlers
│   ├── seed.js               # Database seeding script
│   ├── server.js             # Standalone server & Express application
│   ├── package.json
│   └── .env.example
├── .env.example              # Monorepo environment variable template
├── .gitignore                # Production ignore rules
├── package.json              # Monorepo root workspace configuration
└── vercel.json               # Vercel routing, build commands, and rewrites
```

---

## ⚙️ Key Architectural Highlights

1. **Serverless MongoDB Atlas Connection Caching (`server/config/db.js`)**:
   - Implements global connection promise caching (`global.mongoose`) to eliminate connection churn and prevent exhausting Atlas connection limits during Lambda cold starts and container freezes.
   - Configures `bufferCommands: false`, `serverSelectionTimeoutMS: 5000`, and `maxPoolSize: 10` for fail-fast resilience.
2. **Unified API Routing (`vercel.json` + `api/index.js`)**:
   - Zero CORS in production: `/api/*` requests rewrite internally to the serverless function handler, sharing the same origin domain as the frontend.
   - Dual-mount route architecture supports both standard `/api/*` paths and Vercel path-stripped rewrites.
3. **Vite Development Proxy (`client/vite.config.js`)**:
   - In local development, Vite proxies `/api` requests directly to `http://localhost:5000`, allowing the frontend to use relative `/api` paths universally across dev and production.
4. **Resilient OTP / Email Handling (`server/utils/email.js`)**:
   - Automatically detects if Gmail SMTP credentials are configured. In dev or preview environments where SMTP credentials aren't set, OTPs and confirmation logs are safely simulated and output to the server console rather than crashing the request.

---

## 🚀 MongoDB Atlas Configuration

Before running locally or deploying to Vercel, set up your MongoDB Atlas cluster:

1. **Create an Atlas Cluster**:
   - Sign up at [MongoDB Atlas](https://cloud.mongodb.com).
   - Create a free **M0 Sandbox** cluster.
2. **Configure Database Access**:
   - Go to **Database Access** -> **Add New Database User**.
   - Create a username (e.g. `eventora_admin`) and password.
3. **Configure Network Access (Critical for Vercel)**:
   - Go to **Network Access** -> **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - *Why?* Vercel Serverless Functions execute on dynamic AWS Lambda IP pools. Whitelisting `0.0.0.0/0` ensures your serverless functions can always connect.
4. **Obtain Connection String**:
   - Go to **Database** -> Click **Connect** -> **Drivers (Node.js)**.
   - Copy the URI:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`
   - Replace `<password>` with your database user password.

---

## 💻 Local Development Setup

### 1. Configure Environment Variables
Copy `.env.example` to `server/.env` (and optionally root `.env`):
```bash
cp .env.example server/.env
```
Fill in your MongoDB Atlas connection string and JWT secret:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority
JWT_SECRET=supersecretjwtkey_eventora_monorepo
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_digit_app_password
PORT=5000
NODE_ENV=development
```

### 2. Install All Dependencies (Single Command)
From the monorepo root:
```bash
npm install
```
*npm workspaces automatically install and link dependencies for both `client` and `server`.*

### 3. Seed Database (Optional)
Populate your MongoDB Atlas cluster with demo events and users:
```bash
npm run seed
```

### 4. Start Development Servers
Run frontend and backend simultaneously in one terminal:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend SPA**: `http://localhost:5173`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🌐 Vercel Production Deployment

### Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: setup fullstack Vercel monorepo"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your repository.
   - **Framework Preset**: Vite (auto-detected).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `npm run build` (auto-detected from root `package.json`).
   - **Output Directory**: `client/dist` (auto-detected from `vercel.json`).
3. **Add Environment Variables**:
   In the Vercel project configuration, add:
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_high_entropy_secret_string`
   - `EMAIL_USER`: `your_email@gmail.com` *(optional)*
   - `EMAIL_PASS`: `your_gmail_app_password` *(optional)*
   - `NODE_ENV`: `production`
4. Click **Deploy**.

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy to production
vercel --prod
```

---

## 🧪 Post-Deployment Verification

1. **Verify API Health Check**:
   Visit `https://<your-project>.vercel.app/api/health`.
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "Eventora API",
     "environment": "production",
     "database": "connected",
     "timestamp": "2026-10-29T..."
   }
   ```
2. **Test Frontend SPA**:
   Visit `https://<your-project>.vercel.app/` - your React frontend should render smoothly.
3. **Test Database Operations**:
   - Register a user or log in.
   - Check events and booking requests.

---

## 🛠️ Monorepo NPM Scripts Reference

| Script | Purpose |
|---|---|
| `npm run dev` | Starts server & client concurrently in dev mode |
| `npm run dev:server` | Starts backend server with nodemon |
| `npm run dev:client` | Starts Vite frontend dev server |
| `npm run build` | Builds client SPA to `client/dist` (used by Vercel) |
| `npm run start` | Runs standalone backend server |
| `npm run seed` | Seeds MongoDB Atlas with demo data |
| `npm run lint` | Runs ESLint on client codebase |
