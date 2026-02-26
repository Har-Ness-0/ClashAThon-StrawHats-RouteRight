import mongoose from "mongoose";

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["not_departed", "departed", "completed"],
      default: "not_departed",
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    lastSavedAt: Date,
  },
  { timestamps: true } 
);

const busModel = mongoose.model("Bus", busSchema);

export default busModel;