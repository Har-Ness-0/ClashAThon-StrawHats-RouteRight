RouteRight — Architecture Brief

Team: RouteRight
Date: February 26, 2026

Overview

- RouteRight is a real-time student–bus coordination app: drivers broadcast live location and manage student "wait" requests; students create requests and receive instant feedback.

System components

- Frontend (React + Vite)
  - Key files: `src/frontend/src/context/DriverContext.jsx`, `src/frontend/src/context/SocketContext.jsx`, `src/frontend/src/pages/DriverPanel.jsx`, `src/frontend/src/pages/DriverDashboard.jsx`.
  - Responsibilities: role-based UI, geolocation, map display (Leaflet), REST + Socket usage.

- Backend (Node.js + Express + Socket.IO)
  - Key files: `src/backend/src/server.js`, `src/backend/controllers/*.js`, `src/backend/routes/*.js`, `src/backend/middleware/*.js`.
  - Responsibilities: REST API, JWT auth, role authorization, Socket.IO rooms & events, DB access via Mongoose.

- Database (MongoDB via Mongoose)
  - Models: User, Bus, Route, WaitRequest (`src/backend/models/*.js`).

Core data flow (simple)

1. Authentication: client POSTs credentials to `/api/auth/login` → server returns JWT containing { id, role }.
2. Driver UI: frontend calls `/api/driver/buses` with JWT → backend returns buses (and routes) relevant to driver.
3. Live tracking: driver joins a Socket.IO room for the route and emits `send-location` messages → server relays `receive-location` to students in that room.
4. Appeals/WaitRequests: student POSTs to `/api/wait-requests`; server saves request and emits `receive-wait-request` to the driver room. Driver updates status via PUT `/api/wait-requests/:id` and the server notifies students (`wait-request-status`).

Key Socket events

- From client:
  - `join-route` (join room)
  - `send-location` ({ routeId, latitude, longitude, speed })
  - `send-wait-request` (routeId, requestId)
  - `respond-wait-request` ({ routeId, requestId, status })
  - `request-location` (ask driver to resend location)
  - `driver-offline`

- From server:
  - `receive-location` (to students)
  - `receive-wait-request` (to drivers)
  - `wait-request-status` (to students)
  - `request-location` (to drivers)

Data model (high-level)

- User: { name, email, passwordHash, role: student|driver, assignedBus }
- Route: { name, stops: [{ stopName, lat, lng, order }] }
- Bus: { busNumber, route (ref), driver (ref), status, currentLocation }
- WaitRequest: { bus (ref), stopName, requestedBy (ref), waitMinutes, status }

Security and access control (short)

- Auth: JWT tokens sent in `Authorization: Bearer <token>` header. Middleware `authMiddleware` verifies token and populates `req.user`.
- Role guard: `authorize('driver')` (or `authorize('student')`) prevents unauthorized access to endpoints.
- Data isolation: server-side queries return only the resources relevant to the authenticated user (e.g., driver bus queries filter by `driver == req.user.id`).

Important API endpoints (short list)

- POST /api/auth/login — returns JWT
- GET /api/driver/buses — (driver only) returns assigned buses + routes
- POST /api/wait-requests — (student) create request
- GET /api/wait-requests/driver-req — (driver) list pending requests
- PUT /api/wait-requests/:id — (driver) update status

Deployment / quick start (copy into README)

Prereqs: Node.js, npm, MongoDB, .env containing MONGO_URI and JWT_SECRET.

Start backend

```bash
cd src/backend
npm install
# set .env (MONGO_URI, JWT_SECRET, FRONTEND_URL optional)
npm run dev
```

Start frontend

```bash
cd src/frontend
npm install
npm run dev
```

Notes for judging/demo

- Hidden element to highlight: only the assigned driver can control a bus.
- How to demo: login as driver A → call GET `/api/driver/buses` → only A's buses are returned; UI enables "Start Live Location" only for that bus. Try a different driver to show it's disabled.
- Show a live flow: student POST wait request → server emits `receive-wait-request` → driver approves via UI → server emits `wait-request-status` back to students.


- Sketch boxes: Frontend (Drivers, Students) ↔ Socket.IO / REST API (Express) ↔ MongoDB
- Note arrows: REST for CRUD/auth, Socket.IO rooms per route for realtime events.

Contact & references

- Code pointers: `src/backend/models`, `src/backend/controllers`, `src/frontend/src/context`.

---
