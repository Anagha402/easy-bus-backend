const router=require('express').Router()
const User=require('../Models/usersModel')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const authMiddleware = require('../Middlewares/authMiddleware')


//register new user
router.post('/register',async(req,res)=>{
    
    
    try{
        const existingUser= await User.findOne({email:req.body.email})
        if(existingUser){
           return res.send({
            message:"User already exist",
            success:false,
            data:null
      })

        }
        const hashedPassword=await bcrypt.hash(req.body.password,10);
        req.body.password=hashedPassword
        const newUser=new User(req.body)
        await newUser.save()

         res.send({
            message:"User created successfully",
            success:true,
            data:null
      })



    }catch(error){
        return res.send({
            message:error.message,
            success:false,
            data:null
      })

    }
})

//login
router.post('/login', async(req,res)=>{
    try{
        const userExists= await User.findOne({email:req.body.email})

        if(!userExists){
            return res.send({
                message:"User does not exist",
                success:false,
                data:null
            })
        }
        if(userExists.isBlocked){
            res.send({
                message:"Your account is blocked.Please contact the admin",
                success:false,
                data:null
            })

        }



        const passwordMatch= await bcrypt.compare(req.body.password, userExists.password)

        if(!passwordMatch){
            return res.send({
                message:"Incorrect Password",
                success:false,
                data:null
            })
        }
        const token=jwt.sign({userId:userExists._id},process.env.jwt_secret,{expiresIn:"1d"})
        res.send({
            messsage:"User logged in successfully",
            success:true,
            data:token
        })

    }catch(error){
        res.send({
            messsage:error.message,
            success:false,
            data:null
        })


    }
})

//get-user-by-id
router.post('/get-user-by-id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        res.send({
            message: "User fetched successfully",
            success: true,
            data: user
        });
    } catch (error) {
        res.send({
            message: error.message,
            success: false,
            data: null
        });
    }
});

//get-all-users
router.post('/get-all-users', authMiddleware, async(req,res)=>{
    try{
        const users= await User.find({})
        res.send({
            message:"Users fetched successfully",
            success:true,
            data:users
        })

    }catch(error){
        res.send({
            message:error.message,
            success:false,
            data:null
        })

    }
})

//update-user
router.post("/update-user-permissions", authMiddleware, async(req,res)=>{
    try{
        await User.findByIdAndUpdate(req.body._id, req.body)
        res.send({
            message:"User permissions updated successfully",
            success:true,
            data:null
        })


    }catch(error){
        res.send({
            message:error.message,
            success:false,
            data:null
        })

    }
})

module.exports=router