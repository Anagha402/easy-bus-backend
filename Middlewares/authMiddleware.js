const jwt=require('jsonwebtoken')

module.exports=(req,res,next)=>{
    const token=req.headers.authorization.split(" ")[1];
   try{
    if(!token){
        return res.status(401).send({
            message:"Authorization failed",
            success:false
        })
    }

    const decoded=jwt.verify(token,process.env.jwt_secret);
    req.body.userId=decoded.userId
    next()
   }catch(error){
    return res.status(401).send({
        message:"Authorization failed",
        success:false
    })

   }
}