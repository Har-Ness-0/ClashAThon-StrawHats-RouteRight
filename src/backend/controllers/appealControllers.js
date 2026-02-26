import WaitRequest from "../models/WaitRequest.js";
import Bus from "../models/Bus.js";

export const createWaitReq = async (req, res) => {
  try {
    const { busId, stopName, waitMinutes } = req.body;
    const request = await WaitRequest.create({
      bus: busId,
      stopName,
      waitMinutes,
      requestedBy: req.user.id,
    });

    res.status(201).json(request);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error is createWaitReq controller", error });
  }
};

export const getDriverRequests = async (req, res) => {
  try {
    const bus = await Bus.findOne({ driver: req.user.id });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    const requests = await WaitRequest.find({
      status: "pending",
    }).populate("requestedBy", "name");
    res.json(requests);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error is getDriverRequests controller", error });
  }
};

export const updateWaitRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await WaitRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error is updateWaitReq controller", error });
  }
};
