import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Crop from "../models/Crop.js";
import { auth } from "../middleware/auth.js";

const r = Router();

// BUYER: Place an order
r.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can order"
      });
    }

    const { cropId, quantity, deliveryLocation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cropId)) {
      return res.status(400).json({ message: "Invalid crop ID" });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }

    const crop = await Crop.findById(cropId);

    if (!crop || crop.availabilityStatus !== "Available") {
      return res.status(404).json({
        message: "Crop unavailable"
      });
    }

    if (requestedQuantity > crop.quantity) {
      return res.status(400).json({
        message: "Insufficient crop quantity"
      });
    }

    const total = requestedQuantity * crop.pricePerUnit;

    const order = await Order.create({
      orderId: `AGC-${new Date().getFullYear()}-${Date.now()
        .toString()
        .slice(-6)}`,
      buyerId: req.user.id,
      farmerId: crop.farmerId,
      cropId: crop._id,
      quantity: requestedQuantity,
      unit: crop.unit,
      pricePerUnit: crop.pricePerUnit,
      totalAmount: total,
      deliveryLocation
    });

    crop.quantity -= requestedQuantity;

    if (crop.quantity === 0) {
      crop.availabilityStatus = "Unavailable";
    }

    await crop.save();

    res.status(201).json({
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(400).json({ message: error.message });
  }
});

// FARMER: Dashboard statistics
r.get("/dashboard/stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can access dashboard statistics"
      });
    }

    const farmerId = new mongoose.Types.ObjectId(req.user.id);

    const [
      totalCrops,
      totalOrders,
      newOrders,
      salesResult
    ] = await Promise.all([
      Crop.countDocuments({ farmerId }),

      Order.countDocuments({ farmerId }),

      Order.countDocuments({
        farmerId,
        orderStatus: "Placed"
      }),

      Order.aggregate([
        {
          $match: {
            farmerId,
            paymentStatus: "Successful",
            orderStatus: { $ne: "Rejected" }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    res.json({
      totalCrops,
      totalOrders,
      newOrders,
      totalSales: salesResult[0]?.total || 0
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);
    res.status(500).json({
      message: "Failed to load dashboard statistics"
    });
  }
});

// FARMER: Recent order notifications
r.get("/notifications", auth, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can view notifications"
      });
    }

    const notifications = await Order.find({
      farmerId: req.user.id
    })
      .populate("cropId", "cropName")
      .populate("buyerId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    const result = notifications.map(order => ({
      id: order._id,
      orderId: order.orderId,
      message: `${order.buyerId?.name || "A buyer"} ordered ${
        order.cropId?.cropName || "your crop"
      }`,
      quantity: order.quantity,
      unit: order.unit,
      totalAmount: order.totalAmount,
      status: order.orderStatus,
      createdAt: order.createdAt
    }));

    res.json(result);
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({
      message: "Failed to load notifications"
    });
  }
});

// BUYER/FARMER: Get orders belonging to the logged-in user
r.get("/", auth, async (req, res) => {
  try {
    const key =
      req.user.role === "buyer" ? "buyerId" : "farmerId";

    const orders = await Order.find({
      [key]: req.user.id
    })
      .populate("cropId", "cropName unit")
      .populate("buyerId", "name location")
      .populate("farmerId", "name location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BUYER/FARMER: Get a specific order
r.get("/:id", auth, async (req, res) => {
  try {
    const isMongoId = mongoose.Types.ObjectId.isValid(req.params.id);

    const query = isMongoId
      ? {
          $or: [
            { _id: req.params.id },
            { orderId: req.params.id }
          ]
        }
      : { orderId: req.params.id };

    const order = await Order.findOne(query)
      .populate("cropId", "cropName unit")
      .populate("buyerId", "name location")
      .populate("farmerId", "name location");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (
      String(order.buyerId._id) !== String(req.user.id) &&
      String(order.farmerId._id) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FARMER: Update order status
r.put("/:id/status", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (
      req.user.role !== "farmer" ||
      String(order.farmerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "Only the farmer who received the order can update it"
      });
    }

    const allowedStatuses = [
      "Accepted",
      "Preparing",
      "Packed",
      "Ready for Pickup",
      "Dispatched",
      "In Transit",
      "Delivered",
      "Rejected"
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    if (
      order.orderStatus === "Rejected" ||
      order.orderStatus === "Delivered"
    ) {
      return res.status(400).json({
        message: "This order can no longer be updated"
      });
    }

    order.orderStatus = status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// BUYER: Update payment status
r.post("/:id/payment", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (String(order.buyerId) !== String(req.user.id)) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    if (order.orderStatus === "Rejected") {
      return res.status(400).json({
        message: "Payment cannot be completed for a rejected order"
      });
    }

    // This records a simulated payment result; it does not process
    // a real payment through a payment gateway.
    order.paymentStatus =
      req.body.success === true ? "Successful" : "Failed";

    await order.save();

    res.json({
      message: "Payment status updated",
      order
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default r;