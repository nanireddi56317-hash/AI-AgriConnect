import express from "express";
import Order from "../models/Order.js";
import Crop from "../models/Crop.js";
import Notification from "../models/Notification.js";
import { auth } from "../middleware/auth.js";

const r = express.Router();

// BUY CROP / CREATE ORDER
r.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can order",
      });
    }

    const { cropId, quantity, deliveryLocation } = req.body;

    const crop = await Crop.findById(cropId);

    if (!crop || crop.availabilityStatus !== "Available") {
      return res.status(404).json({
        message: "Crop unavailable",
      });
    }

    if (quantity <= 0 || quantity > crop.quantity) {
      return res.status(400).json({
        message: "Insufficient crop quantity",
      });
    }

    const total = quantity * crop.pricePerUnit;

    // Create order
    const order = await Order.create({
      orderId: `AGC-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-6)}`,

      buyerId: req.user.id,
      farmerId: crop.farmerId,
      cropId,
      quantity,
      unit: crop.unit,
      pricePerUnit: crop.pricePerUnit,
      totalAmount: total,
      deliveryLocation,
    });

    // Reduce crop quantity
    crop.quantity -= quantity;

    if (crop.quantity === 0) {
      crop.availabilityStatus = "Unavailable";
    }

    await crop.save();

    // ⭐ CREATE NOTIFICATION FOR FARMER
    await Notification.create({
      farmerId: crop.farmerId,
      orderId: order._id,
      title: "🌾 New Crop Order",
      message: `A buyer ordered ${quantity} ${crop.unit} of ${crop.cropName}. Total amount: ₹${total}.`,
      isRead: false,
    });

    res.status(201).json(order);
  } catch (e) {
    console.error("Order creation error:", e);

    res.status(400).json({
      message: e.message,
    });
  }
});

// GET ORDERS
r.get("/", auth, async (req, res) => {
  try {
    const key = req.user.role === "buyer" ? "buyerId" : "farmerId";

    const orders = await Order.find({
      [key]: req.user.id,
    })
      .populate("cropId", "cropName unit")
      .populate("buyerId", "name location")
      .populate("farmerId", "name location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

// GET SINGLE ORDER
r.get("/:id", auth, async (req, res) => {
  try {
    const o = await Order.findOne({
      $or: [
        { _id: req.params.id },
        { orderId: req.params.id },
      ],
    })
      .populate("cropId", "cropName unit")
      .populate("buyerId", "name location")
      .populate("farmerId", "name location");

    if (!o) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      String(o.buyerId._id) !== req.user.id &&
      String(o.farmerId._id) !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    res.json(o);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

// UPDATE ORDER STATUS
r.put("/:id/status", auth, async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);

    if (!o) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      req.user.role !== "farmer" ||
      String(o.farmerId) !== req.user.id
    ) {
      return res.status(403).json({
        message: "Only the farmer can update order status",
      });
    }

    o.orderStatus = req.body.status;

    if (req.body.paymentStatus) {
      o.paymentStatus = req.body.paymentStatus;
    }

    await o.save();

    res.json(o);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

// DEMO PAYMENT
r.post("/:id/payment", auth, async (req, res) => {
  try {
    const o = await Order.findById(req.params.id);

    if (!o) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (String(o.buyerId) !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    o.paymentStatus =
      req.body.success === false ? "Failed" : "Successful";

    await o.save();

    res.json(o);
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

export default r;