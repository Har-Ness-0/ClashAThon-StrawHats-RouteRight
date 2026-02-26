





# RECOMMENDED: CHECK USING LIVE URL, THINGS MIGHT BREAK TRYING TO RUN LOCALLY, BUT it is fully functional MVP from our side

# LIVE DEPLOYMENT LINK, VERCEL: https://clashathon-demo-run-2ve7.vercel.app/

# RouteRight | Real-Time Bus Tracking & Management

RouteRight is a browser-based platform providing a seamless real-time connection between students and bus drivers. The system includes live GPS tracking, wait-request management, and role-based dashboards for institutional transportation management.

---

## Local Installation & Setup

To run this project locally for testing and code review, follow these steps:

### 1. Download the Repository

Download or clone the repository and extract it to your local machine.

### 2. Install Dependencies

#### Backend:
```bash
cd src/backend
npm install
```

#### Frontend:
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Ensure the `.env` files for frontend and backend are correctly configured for localhost usage. Refer to the project documentation for specific variable names and values.

### 4. Launch the Application

#### Backend:
```bash
npm run dev
```
Runs on port **5000**.

#### Frontend:
```bash
npm run dev
```
Runs on port **5173**.

Open your browser and navigate to `http://localhost:5173`.

---

## Test Credentials

To experience full funcionality, use the pre-configured accounts below.

> Note: Registration is functional. Newly registered drivers must be manually assigned to routes via the admin panel or database. For demo purposes, use these accounts.

| Role    | Email                             | Password        |
|---------|----------------------------------|----------------|
| Student | student.clashathon@iic.edu.np    | 0827@ClashAThon|
| Driver  | driver.clashathon@iic.edu.np     | 0827@ClashAThon|

---

## Guided Demo Instructions

The application uses JWT stored in `localStorage` for role-based access control. To simulate two users simultaneously, open separate browser sessions.

### Step 1: Student Experience (Tab A)
1. Open your preferred browser.
2. Login using the Student credentials.
3. You will be redirected to the Student Dashboard.
4. A list of routes will appear. If routes are greyed out, the bus is offline and the system is correctly identifying the status.

### Step 2: Driver Experience (Tab B or Incognito)
1. Open a new Incognito window or different browser to avoid session conflicts.
2. Login using the Driver credentials.
3. You will see the specific route assigned to the driver.
4. Click the route to enter the Driver Panel.
5. From here you can:
   - View live map
   - Manage incoming wait requests
   - Broadcast live location

### Step 3: Simulating Live Tracking

#### Option A: Demo Mode (Desktop)
1. In the Driver Panel, click the **Demo Route** button.
2. Switch to the Student tab.
3. The bus icon will move in real-time without refreshing.

#### Option B: Real GPS (Mobile Devices)
1. Open the deployed frontend link on two mobile devices.
2. Login as Student on one device.
3. Login as Driver on the other device.
4. On the Driver device, click **Start Ride**.
5. Move physically with the Driver device. The Student device will track the bus position in real-time using native GPS.

> Note: Laptops may not provide accurate GPS positioning.

### Step 4: Wait Request Feature
1. On the Student dashboard, select an active route.
2. Send a **Wait Request**.
3. On the Driver side, the request will appear instantly in the **Wait Appeals** list.
4. The driver can approve or decline. The status updates on the Student side immediately.

---

## Key Features
- Role-Based Security: JWT authentication and protected APIs.
- Dual-Socket Communication: Instant updates via Socket.io.
- Interactive Mapping: Built with Leaflet.js.
- Hardware Integration: Uses Geolocation API for mobile GPS tracking.

---

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Leaflet.js, Socket.io client
- Backend: Node.js, Express.js, Socket.io server, JWT authentication
- Database: MongoDB

---

## Known Limitations
- Admin dashboard for route assignment is planned post-MVP.
- Newly registered drivers must be manually assigned to routes.
- GPS accuracy depends on the device used.

---

## Roadmap (Post-MVP)
- Admin route assignment dashboard
- Bus arrival notifications
- Low-connectivity driver mode
- Parent notification system
- Analytics dashboard
- AI-assisted ETA prediction

---

## Purpose
This project is developed for hackathon demonstration and institutional transport digitization research.

