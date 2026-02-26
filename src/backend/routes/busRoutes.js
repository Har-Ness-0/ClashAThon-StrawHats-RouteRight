import express from "express";
import { getAllRoutes, getBusById } from "../controllers/studentDashboardControllers.js";

const router = express.Router();

router.get("/dashboard", getAllRoutes);

//This catches requests like /api/student/699d9...
router.get("/:id", getBusById); 

export default router;