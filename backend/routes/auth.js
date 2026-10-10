import {Router} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {auth} from "../middleware/auth.js";
const r=Router();
const token=u=>jwt.sign({id:u._id,role:u.role,name:u.name},process.env.JWT_SECRET,{expiresIn:"7d"});

r.post("/register",async(req,res)=>{
  try{
    const {name,email,phone,password,confirmPassword,role,...rest}=req.body;
    if(!name||!email||!phone||!password||!role) return res.status(400).json({message:"Required fields missing"});
    if(password!==confirmPassword) return res.status(400).json({message:"Passwords do not match"});
    if(!["farmer","buyer"].includes(role)) return res.status(400).json({message:"Invalid role"});
    if(await User.findOne({email})) return res.status(409).json({message:"Email already registered"});
    const hashed=await bcrypt.hash(password,10);
    const user=await User.create({name,email,phone,password:hashed,role,...rest});
    res.status(201).json({token:token(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  }catch(e){res.status(500).json({message:e.message});}
});
r.post("/login",async(req,res)=>{
  try{
    const {email,password,role}=req.body;
    const user=await User.findOne({email,role});
    if(!user||!(await bcrypt.compare(password,user.password))) return res.status(401).json({message:"Invalid email, password, or role"});
    res.json({token:token(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  }catch(e){res.status(500).json({message:e.message});}
});
r.get("/me",auth,async(req,res)=>{const u=await User.findById(req.user.id).select("-password"); res.json(u);});
export default r;
