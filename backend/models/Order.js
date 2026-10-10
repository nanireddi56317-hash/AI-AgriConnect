import mongoose from "mongoose";
const orderSchema=new mongoose.Schema({
  orderId:{type:String,unique:true},
  buyerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  farmerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  cropId:{type:mongoose.Schema.Types.ObjectId,ref:"Crop",required:true},
  quantity:Number,unit:String,pricePerUnit:Number,totalAmount:Number,
  deliveryLocation:String,
  paymentStatus:{type:String,enum:["Pending","Processing","Successful","Failed","Refunded"],default:"Pending"},
  orderStatus:{type:String,enum:["Placed","Accepted","Preparing","Packed","Ready for Pickup","Dispatched","In Transit","Delivered","Rejected"],default:"Placed"}
},{timestamps:true});
export default mongoose.model("Order",orderSchema);
