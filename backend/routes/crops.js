import {Router} from "express";
import Crop from "../models/Crop.js";
import User from "../models/User.js";
import {auth,role} from "../middleware/auth.js";
const r=Router();
r.get("/",async(req,res)=>{
  try{
    const q={availabilityStatus:"Available"};
    if(req.query.cropName) q.cropName={$regex:req.query.cropName,$options:"i"};
    if(req.query.category) q.category=req.query.category;
    if(req.query.location) q.location={$regex:req.query.location,$options:"i"};
    const crops=await Crop.find(q).populate("farmerId","name location phone email").sort({createdAt:-1});
    res.json(crops);
  }catch(e){res.status(500).json({message:e.message});}
});
r.get("/:id",async(req,res)=>{
  try{const c=await Crop.findById(req.params.id).populate("farmerId","name location phone email"); if(!c)return res.status(404).json({message:"Crop not found"}); res.json(c);}
  catch(e){res.status(400).json({message:"Invalid crop id"});}
});
r.post("/",auth,role("farmer"),async(req,res)=>{
  try{const c=await Crop.create({...req.body,farmerId:req.user.id}); res.status(201).json(c);}
  catch(e){res.status(400).json({message:e.message});}
});
r.put("/:id",auth,role("farmer"),async(req,res)=>{
  const c=await Crop.findOneAndUpdate({_id:req.params.id,farmerId:req.user.id},req.body,{new:true});
  if(!c)return res.status(404).json({message:"Crop not found or not yours"}); res.json(c);
});
r.delete("/:id",auth,role("farmer"),async(req,res)=>{
  const c=await Crop.findOneAndDelete({_id:req.params.id,farmerId:req.user.id});
  if(!c)return res.status(404).json({message:"Crop not found or not yours"}); res.json({message:"Crop deleted"});
});
r.get("/farmer/mine",auth,role("farmer"),async(req,res)=>res.json(await Crop.find({farmerId:req.user.id}).sort({createdAt:-1})));
export default r;
