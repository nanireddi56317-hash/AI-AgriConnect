import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  phone:{type:String,required:true},
  password:{type:String,required:true},
  role:{type:String,enum:["farmer","buyer"],required:true},
  state:String,district:String,village:String,location:String,pincode:String,
  farmName:String,farmSize:String,mainCrops:String,buyerType:String,deliveryLocation:String
},{timestamps:true});
export default mongoose.model("User",userSchema);
