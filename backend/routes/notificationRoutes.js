import express from "express";
import Notification from "../models/Notification.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Get farmer notifications
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can view notifications",
      });
    }

    const notifications = await Notification.find({
      farmerId: req.user.id,
    })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load notifications",
    });
  }
});

// Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        farmerId: req.user.id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
});

export default router;