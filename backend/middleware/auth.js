const jwt=require('jsonwebtoken'),S=process.env.JWT_SECRET||'confelion_secret'
exports.auth=(req,res,next)=>{
 const h=req.headers.authorization
 if(!h) return res.status(401).json({error:'No token'})
 try{req.user=jwt.verify(h.split(' ')[1]||h,S);next()}catch{res.status(401).json({error:'Invalid token'})}
}
exports.admin=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({error:'Admin only'})
exports.sign=(p)=>jwt.sign(p,S,{expiresIn:'7d'})