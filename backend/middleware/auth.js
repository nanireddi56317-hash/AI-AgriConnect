import jwt from "jsonwebtoken";
export function auth(req,res,next){
  const token=req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1] : null;
  if(!token) return res.status(401).json({message:"Authentication required"});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({message:"Invalid or expired token"}); }
}
export const role=(...roles)=>(req,res,next)=>{
  if(!roles.includes(req.user.role)) return res.status(403).json({message:"Not authorized"});
  next();
};
