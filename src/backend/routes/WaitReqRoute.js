import express from "express";
import {
  createWaitReq,
  getDriverRequests,
  updateWaitRequest,
} from "../controllers/appealControllers.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.post("/", authMiddleware, authorize("student"), createWaitReq);
router.get(
  "/driver-req",
  authMiddleware,
  authorize("driver"),
  getDriverRequests,
);
router.put("/:id", authMiddleware, authorize("driver"), updateWaitRequest);

export default router;
