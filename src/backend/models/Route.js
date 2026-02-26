import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    Startlat: Number,
    Startlng: Number,
    Endlat: Number,
    Endlng: Number,
    stops: [
      {
        stopName: String,
        lat: Number,
        lng: Number,
        order: Number,
      },
    ],
  },
  { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema);
export default Route;