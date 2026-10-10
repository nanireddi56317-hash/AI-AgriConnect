import mongoose from "mongoose";
const cropSchema=new mongoose.Schema({
  farmerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  cropName:{type:String,required:true},category:String,description:String,
  quantity:{type:Number,required:true,min:0},unit:{type:String,default:"KG"},
  pricePerUnit:{type:Number,required:true,min:0},minimumPrice:{type:Number,min:0},
  harvestDate:String,availableFrom:String,location:String,image:String,
  farmingType:{type:String,enum:["Organic","Conventional"],default:"Conventional"},
  availabilityStatus:{type:String,enum:["Available","Unavailable"],default:"Available"}
},{timestamps:true});
export default mongoose.model("Crop",cropSchema);
