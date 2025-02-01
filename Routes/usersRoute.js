const router=require('express').Router()
const User=require('../Models/usersModel')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const authMiddleware = require('../Middlewares/authMiddleware')
const nodemailer=require('nodemailer')

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS,  
    },
});

// Generate OTP function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send({ message: "User already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity

        const newUser = new User({ name, email, password: hashedPassword, otp, otpExpires });
        await newUser.save();

        // Send OTP via email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        });

        return res.send({ message: "OTP sent. Please verify.", success: true });

    } catch (error) {
        return res.status(500).send({ message: error.message, success: false });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.send({ message: "Invalid or expired OTP", success: false });
        }

        user.otp = null;  
        user.otpExpires = null;  
        await user.save();

        return res.send({ message: "OTP verified successfully", success: true });

    } catch (error) {
        return res.status(500).send({ message: error.message, success: false });
    }
});

//register new user
// router.post('/register',async(req,res)=>{
    
    
//     try{
//         const existingUser= await User.findOne({email:req.body.email})
//         if(existingUser){
//            return res.send({
//             message:"User already exist",
//             success:false,
//             data:null
//       })

//         }
//         const hashedPassword=await bcrypt.hash(req.body.password,10);
//         req.body.password=hashedPassword
//         const newUser=new User(req.body)
//         await newUser.save()

//          res.send({
//             message:"User created successfully",
//             success:true,
//             data:null
//       })



//     }catch(error){
//         return res.send({
//             message:error.message,
//             success:false,
//             data:null
//       })

//     }
// })

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
        const users= await User.find({}).skip(1)
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