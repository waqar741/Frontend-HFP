# Login & Signup Implementation Guide

This folder contains all the boilerplate code needed to implement a robust JWT authentication system for your HealthFirstPriority app.

## Folder Structure Summary
- `backend/`: Code meant to be deployed on your Digital Ocean server. Uses Express.js, PostgreSQL, and bcrypt for auth.
- `frontend/`: Code meant to be integrated into your Next.js application for talking to the backend.

---

## 1. Backend Setup (Digital Ocean)
Your backend needs to expose endpoints for the frontend to hit.

### Prerequisites
1. Ensure Node.js and PostgreSQL are installed on your Digital Ocean server.
2. Open yor database and run the SQL commands found in `backend/init.sql` to create the `users` table.

### Installation & Running
1. Copy the `backend` folder to your Digital Ocean server.
2. Traverse into the folder: `cd backend`
3. Install the dependencies: `npm install` 
4. Rename `.env.example` to `.env` and fill in your actual Digital Ocean PostgreSQL details and a strong random string for `JWT_SECRET`.
5. Start the server using `node server.js` (or use PM2 for production execution: `pm2 start server.js`).

---

## 2. Frontend Setup (Next.js)

### Integration into your current code
1. **API Functions (`api.ts`)**: Move these functions into your Next.js project's utilities (e.g., `lib/api.ts` or `services/api.ts`).
2. **State Management (`authStore.ts`)**: Move this into your project (e.g., `store/authStore.ts`). It utilizes `zustand` which you already have installed.
3. **UI Components (`LoginForm.tsx`)**: Drop this into an app route like `app/login/page.tsx` or `app/(auth)/login/page.tsx` and fix the import paths for `api` and `authStore`.
   * Note: You will need to make a `SignupForm.tsx` that calls `signupUser()` from `api.ts` in the exact same way.
4. **Environment Configuration**: Add the address of your Digital Ocean backend to your Next.js `.env` file at the root of `HealthFirstPriority`:
```env
NEXT_PUBLIC_API_URL=http://your-digital-ocean-ip:5000/api
```

## Flow Overview
1.  **Signup:** Frontend form calls `POST /api/signup`. Backend hashes the password securely using `bcrypt` and inserts it into PostgreSQL. It returns a JWT.
2.  **Login:** Frontend form calls `POST /api/login`. Backend queries PostgreSQL and uses `bcrypt.compare` to verify passwords. It returns a JWT.
3.  **Authentication:** After the frontend receives a token during Login/Signup, the Zustand `authStore` secures it in `localStorage`. 
4.  **Protecting Routes:** Any future API requests that require the user to be logged in should map the token inside an `Authorization: Bearer <token>` HTTP header, and the backend Express route will read it through the `authenticateToken` middleware.
