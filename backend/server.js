import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import cropRoutes from "./routes/crops.js";
import orderRoutes from "./routes/orders.js";
import notificationRoutes from "./routes/notificationRoutes.js";


dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req,res)=>res.json({ok:true, message:"AI AgriConnect API running"}));
app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(()=>app.listen(PORT,()=>console.log(`Backend running on http://localhost:${PORT}`)))
  .catch(err=>{console.error("MongoDB connection failed:",err.message); process.exit(1);});
