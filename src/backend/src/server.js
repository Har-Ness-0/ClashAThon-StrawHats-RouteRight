import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";
import authenticate from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";
import busRoutes from "../routes/busRoutes.js";
import http from "http";
import waitReqRoute from "../routes/WaitReqRoute.js";
import Bus from "../models/Bus.js";
import { Server } from "socket.io";
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/api/authenticate", authenticate, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});
app.use("/api/student", busRoutes);
app.use("/api/wait-requests", waitReqRoute);
app.get(
  "/api/driver/buses",
  authenticate,
  authorize("driver"),
  async (req, res) => {
    try {
      // takes every bus in the database and populates its route
      const buses = await Bus.find({}).populate("route");
      res.json(buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ message: "Server Error fetching buses" });
    }
  },
);

app.get(
  "/api/driver/buses",
  authenticate,
  authorize("driver"),
  async (req, res) => {
    try {
      // Find buses where this driver is assigned, and populate the route details!
      const buses = await Bus.find({ driver: driverId }).populate("route");
      res.json(buses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error fetching buses" });
    }
  },
);
app.get("/", (req, res) => {
  res.send("API Running");
});

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }, // Allowing all originns for testing
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Listen for someone joining a specific route
  socket.on("join-route", (routeId) => {
    socket.join(routeId);
    console.log(`User ${socket.id} joined route room: ${routeId}`);
  });

  socket.on("send-wait-request", (data) => {
    // data contains: { routeId, requestId }
    io.to(data.routeId).emit("receive-wait-request", data);
  });

  socket.on("respond-wait-request", (data) => {
    // data contains: { routeId, requestId, status }
    io.to(data.routeId).emit("wait-request-status", data);
  });

  // Driver telling students they are going offline
  socket.on("driver-offline", (data) => {
    io.to(data.routeId).emit("driver-offline", data);
  });

  // Student asking the driver for their current location on page load
  socket.on("request-location", (routeId) => {
    io.to(routeId).emit("request-location");
  });

  // 2. Driver sends location TO A SPECIFIC ROUTE
  socket.on("send-location", (data) => {
    const { routeId, latitude, longitude, speed } = data;

    // socket.to(routeId).emit sends it to everyone in that room EXCEPT the sender
    socket.to(routeId).emit("receive-location", {
      id: socket.id,

      latitude,
      longitude,
      speed,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    io.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
