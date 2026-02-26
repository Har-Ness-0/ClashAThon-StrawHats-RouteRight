import Bus from "../models/Bus.js"; // Adjust path to your model
import Route from "../models/Route.js"; // Adjust path

export const getDriverBus = async (req, res) => {
  try {
    // req.user._id comes from your verifyToken middleware
    const driverId = req.user._id; 

    // Find the bus assigned to this driver AND populate the route info!
    const bus = await Bus.find({ driver: driverId }).populate("route");

    if (!bus || bus.length === 0) {
      return res.status(404).json({ message: "No assigned buses found for this driver." });
    }

    res.status(200).json(bus);
  } catch (error) {
    console.error("Error fetching driver bus:", error);
    res.status(500).json({ message: "Server error" });
  }
};