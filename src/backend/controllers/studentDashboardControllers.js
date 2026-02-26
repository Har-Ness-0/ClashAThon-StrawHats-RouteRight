import Route from "../models/Route.js";
import Bus from "../models/Bus.js";

export async function getAllRoutes(req, res) {
  try {
    const routes = await Route.find();
    res.status(201).json(routes);
  } catch (error) {
    console.error("Error in getAllRoutes controller", error);
  }
}

export const getBusById = async (req, res) => {
  try {
    const busId = req.params.id;

    const bus = await Bus.findById(busId).populate("route");

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json(bus);
  } catch (error) {
    console.error("Error fetching bus details:", error);
    res.status(500).json({ message: "Server error fetching bus details" });
  }
};
